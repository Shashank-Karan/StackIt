import os
from flask import Flask, request, jsonify, session
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
from flask_session import Session
from flask_marshmallow import Marshmallow
from dotenv import load_dotenv
import bcrypt
import google.generativeai as genai
from datetime import datetime
from typing import List, Optional
import json

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)

# Configuration
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key')
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SESSION_TYPE'] = 'sqlalchemy'
app.config['SESSION_PERMANENT'] = False
app.config['SESSION_USE_SIGNER'] = True
app.config['SESSION_KEY_PREFIX'] = 'stackit:'

# Initialize extensions
db = SQLAlchemy(app)
migrate = Migrate(app, db)
ma = Marshmallow(app)
CORS(app, supports_credentials=True)

# Configure session
app.config['SESSION_SQLALCHEMY'] = db
Session(app)

# Configure Gemini AI
genai.configure(api_key=os.getenv('GEMINI_API_KEY'))

# Database Models
class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=True)
    password_hash = db.Column(db.String(255), nullable=False)
    first_name = db.Column(db.String(50), nullable=True)
    last_name = db.Column(db.String(50), nullable=True)
    profile_image_url = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    questions = db.relationship('Question', backref='author', lazy=True)
    answers = db.relationship('Answer', backref='author', lazy=True)
    votes = db.relationship('Vote', backref='user', lazy=True)
    notifications = db.relationship('Notification', backref='user', lazy=True)

class Question(db.Model):
    __tablename__ = 'questions'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    author_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    tags = db.Column(db.JSON, nullable=True)
    vote_score = db.Column(db.Integer, default=0)
    view_count = db.Column(db.Integer, default=0)
    accepted_answer_id = db.Column(db.Integer, db.ForeignKey('answers.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    answers = db.relationship('Answer', backref='question', lazy=True, foreign_keys='Answer.question_id')
    votes = db.relationship('Vote', backref='question', lazy=True)
    notifications = db.relationship('Notification', backref='question', lazy=True)

class Answer(db.Model):
    __tablename__ = 'answers'
    
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.Text, nullable=False)
    question_id = db.Column(db.Integer, db.ForeignKey('questions.id'), nullable=False)
    author_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    vote_score = db.Column(db.Integer, default=0)
    is_accepted = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    votes = db.relationship('Vote', backref='answer', lazy=True)

class Vote(db.Model):
    __tablename__ = 'votes'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    question_id = db.Column(db.Integer, db.ForeignKey('questions.id'), nullable=True)
    answer_id = db.Column(db.Integer, db.ForeignKey('answers.id'), nullable=True)
    vote_type = db.Column(db.Enum('up', 'down', name='vote_types'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Notification(db.Model):
    __tablename__ = 'notifications'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    type = db.Column(db.String(50), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    message = db.Column(db.Text, nullable=True)
    question_id = db.Column(db.Integer, db.ForeignKey('questions.id'), nullable=True)
    answer_id = db.Column(db.Integer, db.ForeignKey('answers.id'), nullable=True)
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

# Marshmallow Schemas
class UserSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = User
        load_instance = True
        exclude = ('password_hash',)

class QuestionSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Question
        load_instance = True
        include_fk = True
    
    author = ma.Nested(UserSchema)
    answers = ma.Nested('AnswerSchema', many=True)

class AnswerSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Answer
        load_instance = True
        include_fk = True
    
    author = ma.Nested(UserSchema)

class VoteSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Vote
        load_instance = True
        include_fk = True

class NotificationSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Notification
        load_instance = True
        include_fk = True
    
    question = ma.Nested(QuestionSchema)
    answer = ma.Nested(AnswerSchema)

# Initialize schemas
user_schema = UserSchema()
users_schema = UserSchema(many=True)
question_schema = QuestionSchema()
questions_schema = QuestionSchema(many=True)
answer_schema = AnswerSchema()
answers_schema = AnswerSchema(many=True)
vote_schema = VoteSchema()
votes_schema = VoteSchema(many=True)
notification_schema = NotificationSchema()
notifications_schema = NotificationSchema(many=True)

# Utility functions
def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, password_hash: str) -> bool:
    """Verify a password against its hash."""
    return bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8'))

def require_auth(f):
    """Decorator to require authentication."""
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'message': 'Unauthorized'}), 401
        return f(*args, **kwargs)
    decorated_function.__name__ = f.__name__
    return decorated_function

def get_current_user():
    """Get the current authenticated user."""
    if 'user_id' in session:
        return User.query.get(session['user_id'])
    return None

# Routes
@app.route('/api/auth/register', methods=['POST'])
def register():
    """Register a new user."""
    data = request.get_json()
    
    # Validate required fields
    if not data.get('username') or not data.get('password'):
        return jsonify({'message': 'Username and password are required'}), 400
    
    # Check if username already exists
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'message': 'Username already exists'}), 400
    
    # Check if email already exists (if provided)
    if data.get('email') and User.query.filter_by(email=data['email']).first():
        return jsonify({'message': 'Email already exists'}), 400
    
    # Create new user
    user = User(
        username=data['username'],
        email=data.get('email'),
        password_hash=hash_password(data['password']),
        first_name=data.get('firstName'),
        last_name=data.get('lastName')
    )
    
    db.session.add(user)
    db.session.commit()
    
    # Log user in
    session['user_id'] = user.id
    
    return jsonify({'user': user_schema.dump(user)})

@app.route('/api/auth/login', methods=['POST'])
def login():
    """Login a user."""
    data = request.get_json()
    
    if not data.get('username') or not data.get('password'):
        return jsonify({'message': 'Username and password are required'}), 400
    
    # Find user
    user = User.query.filter_by(username=data['username']).first()
    
    if not user or not verify_password(data['password'], user.password_hash):
        return jsonify({'message': 'Invalid credentials'}), 401
    
    # Log user in
    session['user_id'] = user.id
    
    return jsonify({'user': user_schema.dump(user)})

@app.route('/api/auth/logout', methods=['POST'])
def logout():
    """Logout the current user."""
    session.pop('user_id', None)
    return jsonify({'message': 'Logged out successfully'})

@app.route('/api/auth/user', methods=['GET'])
def get_user():
    """Get current user information."""
    user = get_current_user()
    if not user:
        return jsonify({'message': 'Unauthorized'}), 401
    
    return jsonify(user_schema.dump(user))

@app.route('/api/questions', methods=['GET'])
def get_questions():
    """Get all questions with optional filtering."""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('limit', 10, type=int)
    search = request.args.get('search', '')
    filter_type = request.args.get('filter', '')
    
    query = Question.query
    
    # Apply search filter
    if search:
        query = query.filter(Question.title.ilike(f'%{search}%'))
    
    # Apply filter type
    if filter_type == 'unanswered':
        query = query.filter(~Question.answers.any())
    elif filter_type == 'newest':
        query = query.order_by(Question.created_at.desc())
    else:
        query = query.order_by(Question.created_at.desc())
    
    # Paginate results
    offset = (page - 1) * per_page
    questions = query.offset(offset).limit(per_page).all()
    
    return jsonify(questions_schema.dump(questions))

@app.route('/api/questions/<int:question_id>', methods=['GET'])
def get_question(question_id):
    """Get a specific question with its answers."""
    question = Question.query.get_or_404(question_id)
    
    # Increment view count
    question.view_count += 1
    db.session.commit()
    
    return jsonify(question_schema.dump(question))

@app.route('/api/questions', methods=['POST'])
@require_auth
def create_question():
    """Create a new question."""
    data = request.get_json()
    user = get_current_user()
    
    if not data.get('title') or not data.get('description'):
        return jsonify({'message': 'Title and description are required'}), 400
    
    question = Question(
        title=data['title'],
        description=data['description'],
        author_id=user.id,
        tags=data.get('tags', [])
    )
    
    db.session.add(question)
    db.session.commit()
    
    return jsonify(question_schema.dump(question))

@app.route('/api/questions/<int:question_id>/answers', methods=['POST'])
@require_auth
def create_answer(question_id):
    """Create a new answer for a question."""
    data = request.get_json()
    user = get_current_user()
    
    question = Question.query.get_or_404(question_id)
    
    if not data.get('content'):
        return jsonify({'message': 'Content is required'}), 400
    
    answer = Answer(
        content=data['content'],
        question_id=question_id,
        author_id=user.id
    )
    
    db.session.add(answer)
    db.session.commit()
    
    # Create notification for question author
    if question.author_id != user.id:
        notification = Notification(
            user_id=question.author_id,
            type='answer',
            title='New answer to your question',
            message=f'{user.username} answered your question "{question.title}"',
            question_id=question_id,
            answer_id=answer.id
        )
        db.session.add(notification)
        db.session.commit()
    
    return jsonify(answer_schema.dump(answer))

@app.route('/api/questions/<int:question_id>/answers/<int:answer_id>/accept', methods=['POST'])
@require_auth
def accept_answer(question_id, answer_id):
    """Accept an answer for a question."""
    user = get_current_user()
    question = Question.query.get_or_404(question_id)
    answer = Answer.query.get_or_404(answer_id)
    
    # Check if user is the question author
    if question.author_id != user.id:
        return jsonify({'message': 'Only the question author can accept answers'}), 403
    
    # Unaccept previous answer
    if question.accepted_answer_id:
        prev_answer = Answer.query.get(question.accepted_answer_id)
        if prev_answer:
            prev_answer.is_accepted = False
    
    # Accept new answer
    answer.is_accepted = True
    question.accepted_answer_id = answer_id
    
    db.session.commit()
    
    return jsonify({'message': 'Answer accepted successfully'})

@app.route('/api/vote', methods=['POST'])
@require_auth
def vote():
    """Vote on a question or answer."""
    data = request.get_json()
    user = get_current_user()
    
    vote_type = data.get('voteType')
    question_id = data.get('questionId')
    answer_id = data.get('answerId')
    
    if vote_type not in ['up', 'down']:
        return jsonify({'message': 'Invalid vote type'}), 400
    
    # Check if user has already voted
    existing_vote = Vote.query.filter_by(
        user_id=user.id,
        question_id=question_id,
        answer_id=answer_id
    ).first()
    
    if existing_vote:
        # Update existing vote
        existing_vote.vote_type = vote_type
        existing_vote.updated_at = datetime.utcnow()
    else:
        # Create new vote
        new_vote = Vote(
            user_id=user.id,
            question_id=question_id,
            answer_id=answer_id,
            vote_type=vote_type
        )
        db.session.add(new_vote)
    
    db.session.commit()
    
    # Update vote scores
    if question_id:
        question = Question.query.get(question_id)
        question.vote_score = Vote.query.filter_by(question_id=question_id).filter_by(vote_type='up').count() - \
                             Vote.query.filter_by(question_id=question_id).filter_by(vote_type='down').count()
    
    if answer_id:
        answer = Answer.query.get(answer_id)
        answer.vote_score = Vote.query.filter_by(answer_id=answer_id).filter_by(vote_type='up').count() - \
                           Vote.query.filter_by(answer_id=answer_id).filter_by(vote_type='down').count()
    
    db.session.commit()
    
    return jsonify({'message': 'Vote recorded successfully'})

@app.route('/api/notifications', methods=['GET'])
@require_auth
def get_notifications():
    """Get notifications for the current user."""
    user = get_current_user()
    
    notifications = Notification.query.filter_by(user_id=user.id).order_by(Notification.created_at.desc()).limit(20).all()
    
    return jsonify(notifications_schema.dump(notifications))

@app.route('/api/notifications/unread-count', methods=['GET'])
@require_auth
def get_unread_count():
    """Get unread notification count for the current user."""
    user = get_current_user()
    
    count = Notification.query.filter_by(user_id=user.id, is_read=False).count()
    
    return jsonify({'count': count})

@app.route('/api/notifications/<int:notification_id>/read', methods=['POST'])
@require_auth
def mark_notification_read(notification_id):
    """Mark a notification as read."""
    user = get_current_user()
    
    notification = Notification.query.filter_by(id=notification_id, user_id=user.id).first_or_404()
    notification.is_read = True
    
    db.session.commit()
    
    return jsonify({'message': 'Notification marked as read'})

# AI-powered features
@app.route('/api/ai/suggest-similar', methods=['POST'])
@require_auth
def suggest_similar_questions():
    """Suggest similar questions using AI."""
    data = request.get_json()
    question_text = data.get('question', '')
    
    if not question_text:
        return jsonify({'message': 'Question text is required'}), 400
    
    try:
        model = genai.GenerativeModel('gemini-2.5-flash')
        
        # Get all questions for similarity search
        questions = Question.query.all()
        question_texts = [f"{q.title}: {q.description}" for q in questions]
        
        prompt = f"""
        Given this new question: "{question_text}"
        
        And these existing questions:
        {chr(10).join(question_texts)}
        
        Find the 3 most similar questions and explain why they're similar.
        Return as JSON with format: {{"similar_questions": [{{"title": "", "reason": ""}}]}}
        """
        
        response = model.generate_content(prompt)
        
        return jsonify({'suggestions': response.text})
        
    except Exception as e:
        return jsonify({'message': 'Failed to generate suggestions', 'error': str(e)}), 500

@app.route('/api/ai/improve-grammar', methods=['POST'])
@require_auth
def improve_grammar():
    """Improve grammar and clarity of text using AI."""
    data = request.get_json()
    text = data.get('text', '')
    
    if not text:
        return jsonify({'message': 'Text is required'}), 400
    
    try:
        model = genai.GenerativeModel('gemini-2.5-flash')
        
        prompt = f"""
        Please improve the grammar, clarity, and readability of this text while preserving its original meaning:
        
        "{text}"
        
        Return only the improved text, nothing else.
        """
        
        response = model.generate_content(prompt)
        
        return jsonify({'improved_text': response.text})
        
    except Exception as e:
        return jsonify({'message': 'Failed to improve text', 'error': str(e)}), 500

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({'message': 'Resource not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'message': 'Internal server error'}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)