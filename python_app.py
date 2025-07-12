#!/usr/bin/env python3
"""
StackIt - Python-based Q&A Platform
A complete question and answer platform built with Flask and PostgreSQL.
"""

import os
import json
from datetime import datetime
from typing import Optional, List, Dict, Any
from flask import Flask, request, jsonify, session, render_template_string
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize extensions
db = SQLAlchemy(app)
CORS(app, supports_credentials=True)

# Configure Gemini AI
if os.getenv('GEMINI_API_KEY'):
    genai.configure(api_key=os.getenv('GEMINI_API_KEY'))

# Database Models (using existing schema)
class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(255), unique=True, nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=True)
    password_hash = db.Column(db.String(255), nullable=False)
    first_name = db.Column(db.String(255), nullable=True)
    last_name = db.Column(db.String(255), nullable=True)
    profile_image_url = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Question(db.Model):
    __tablename__ = 'questions'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=False)
    author_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    tags = db.Column(db.Text, nullable=True)  # JSON stored as text
    vote_score = db.Column(db.Integer, default=0)
    view_count = db.Column(db.Integer, default=0)
    accepted_answer_id = db.Column(db.Integer, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    author = db.relationship('User', backref='questions')
    answers = db.relationship('Answer', backref='question', lazy='dynamic')

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
    author = db.relationship('User', backref='answers')

class Vote(db.Model):
    __tablename__ = 'votes'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    question_id = db.Column(db.Integer, db.ForeignKey('questions.id'), nullable=True)
    answer_id = db.Column(db.Integer, db.ForeignKey('answers.id'), nullable=True)
    vote_type = db.Column(db.String(10), nullable=False)  # 'up' or 'down'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Notification(db.Model):
    __tablename__ = 'notifications'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    type = db.Column(db.String(50), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    message = db.Column(db.Text, nullable=True)
    question_id = db.Column(db.Integer, db.ForeignKey('questions.id'), nullable=True)
    answer_id = db.Column(db.Integer, db.ForeignKey('answers.id'), nullable=True)
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', backref='notifications')
    question = db.relationship('Question', backref='notifications')
    answer = db.relationship('Answer', backref='notifications')

# Utility functions
def require_auth(f):
    """Decorator to require authentication."""
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'message': 'Unauthorized'}), 401
        return f(*args, **kwargs)
    decorated_function.__name__ = f.__name__
    return decorated_function

def get_current_user() -> Optional[User]:
    """Get the current authenticated user."""
    if 'user_id' in session:
        return User.query.get(session['user_id'])
    return None

def serialize_user(user: User) -> Dict[str, Any]:
    """Serialize a user object."""
    return {
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'firstName': user.first_name,
        'lastName': user.last_name,
        'profileImageUrl': user.profile_image_url,
        'createdAt': user.created_at.isoformat(),
        'updatedAt': user.updated_at.isoformat()
    }

def serialize_question(question: Question) -> Dict[str, Any]:
    """Serialize a question object with its answers."""
    answers = []
    for answer in question.answers:
        answers.append({
            'id': answer.id,
            'content': answer.content,
            'authorId': answer.author_id,
            'voteScore': answer.vote_score,
            'isAccepted': answer.is_accepted,
            'createdAt': answer.created_at.isoformat(),
            'updatedAt': answer.updated_at.isoformat(),
            'author': serialize_user(answer.author)
        })
    
    # Parse tags
    tags = []
    if question.tags:
        try:
            tags = json.loads(question.tags)
        except (json.JSONDecodeError, TypeError):
            tags = []
    
    return {
        'id': question.id,
        'title': question.title,
        'description': question.description,
        'authorId': question.author_id,
        'tags': tags,
        'voteScore': question.vote_score,
        'viewCount': question.view_count,
        'acceptedAnswerId': question.accepted_answer_id,
        'createdAt': question.created_at.isoformat(),
        'updatedAt': question.updated_at.isoformat(),
        'author': serialize_user(question.author),
        'answers': answers,
        '_count': {'answers': len(answers)}
    }

def serialize_notification(notification: Notification) -> Dict[str, Any]:
    """Serialize a notification object."""
    result = {
        'id': notification.id,
        'userId': notification.user_id,
        'type': notification.type,
        'title': notification.title,
        'message': notification.message,
        'questionId': notification.question_id,
        'answerId': notification.answer_id,
        'isRead': notification.is_read,
        'createdAt': notification.created_at.isoformat()
    }
    
    if notification.question:
        result['question'] = serialize_question(notification.question)
    if notification.answer:
        result['answer'] = {
            'id': notification.answer.id,
            'content': notification.answer.content,
            'author': serialize_user(notification.answer.author)
        }
    
    return result

# Authentication routes
@app.route('/api/auth/register', methods=['POST'])
def register():
    """Register a new user."""
    data = request.get_json()
    
    if not data.get('username') or not data.get('password'):
        return jsonify({'message': 'Username and password are required'}), 400
    
    # Check if username already exists
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'message': 'Username already exists'}), 400
    
    # Check if email already exists
    if data.get('email') and User.query.filter_by(email=data['email']).first():
        return jsonify({'message': 'Email already exists'}), 400
    
    # Create new user
    user = User(
        username=data['username'],
        email=data.get('email'),
        password_hash=generate_password_hash(data['password']),
        first_name=data.get('firstName'),
        last_name=data.get('lastName')
    )
    
    db.session.add(user)
    db.session.commit()
    
    # Log user in
    session['user_id'] = user.id
    
    return jsonify({'user': serialize_user(user)})

@app.route('/api/auth/login', methods=['POST'])
def login():
    """Login a user."""
    data = request.get_json()
    
    if not data.get('username') or not data.get('password'):
        return jsonify({'message': 'Username and password are required'}), 400
    
    user = User.query.filter_by(username=data['username']).first()
    
    if not user or not check_password_hash(user.password_hash, data['password']):
        return jsonify({'message': 'Invalid credentials'}), 401
    
    session['user_id'] = user.id
    
    return jsonify({'user': serialize_user(user)})

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
    
    return jsonify(serialize_user(user))

# Question routes
@app.route('/api/questions', methods=['GET'])
def get_questions():
    """Get all questions with optional filtering."""
    search = request.args.get('search', '')
    filter_type = request.args.get('filter', '')
    limit = int(request.args.get('limit', 10))
    offset = int(request.args.get('offset', 0))
    
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
    
    # Apply pagination
    questions = query.offset(offset).limit(limit).all()
    
    return jsonify([serialize_question(q) for q in questions])

@app.route('/api/questions/<int:question_id>', methods=['GET'])
def get_question(question_id):
    """Get a specific question with its answers."""
    question = Question.query.get_or_404(question_id)
    
    # Increment view count
    question.view_count += 1
    db.session.commit()
    
    return jsonify(serialize_question(question))

@app.route('/api/questions', methods=['POST'])
@require_auth
def create_question():
    """Create a new question."""
    data = request.get_json()
    user = get_current_user()
    
    if not data.get('title') or not data.get('description'):
        return jsonify({'message': 'Title and description are required'}), 400
    
    # Store tags as JSON string
    tags_json = json.dumps(data.get('tags', []))
    
    question = Question(
        title=data['title'],
        description=data['description'],
        author_id=user.id,
        tags=tags_json
    )
    
    db.session.add(question)
    db.session.commit()
    
    return jsonify(serialize_question(question))

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
    
    return jsonify({
        'id': answer.id,
        'content': answer.content,
        'authorId': answer.author_id,
        'voteScore': answer.vote_score,
        'isAccepted': answer.is_accepted,
        'createdAt': answer.created_at.isoformat(),
        'updatedAt': answer.updated_at.isoformat(),
        'author': serialize_user(answer.author)
    })

@app.route('/api/questions/<int:question_id>/answers/<int:answer_id>/accept', methods=['POST'])
@require_auth
def accept_answer(question_id, answer_id):
    """Accept an answer for a question."""
    user = get_current_user()
    question = Question.query.get_or_404(question_id)
    answer = Answer.query.get_or_404(answer_id)
    
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

# Voting routes
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
        existing_vote.vote_type = vote_type
        existing_vote.updated_at = datetime.utcnow()
    else:
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
        up_votes = Vote.query.filter_by(question_id=question_id, vote_type='up').count()
        down_votes = Vote.query.filter_by(question_id=question_id, vote_type='down').count()
        question.vote_score = up_votes - down_votes
    
    if answer_id:
        answer = Answer.query.get(answer_id)
        up_votes = Vote.query.filter_by(answer_id=answer_id, vote_type='up').count()
        down_votes = Vote.query.filter_by(answer_id=answer_id, vote_type='down').count()
        answer.vote_score = up_votes - down_votes
    
    db.session.commit()
    
    return jsonify({'message': 'Vote recorded successfully'})

# Notification routes
@app.route('/api/notifications', methods=['GET'])
@require_auth
def get_notifications():
    """Get notifications for the current user."""
    user = get_current_user()
    
    notifications = Notification.query.filter_by(user_id=user.id).order_by(Notification.created_at.desc()).limit(20).all()
    
    return jsonify([serialize_notification(n) for n in notifications])

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
    
    if not os.getenv('GEMINI_API_KEY'):
        return jsonify({'message': 'AI features not available'}), 503
    
    try:
        model = genai.GenerativeModel('gemini-2.5-flash')
        
        # Get recent questions for context
        questions = Question.query.order_by(Question.created_at.desc()).limit(50).all()
        question_contexts = []
        
        for q in questions:
            question_contexts.append(f"ID: {q.id}, Title: {q.title}, Description: {q.description[:200]}...")
        
        prompt = f"""
        Given this new question: "{question_text}"
        
        And these existing questions:
        {chr(10).join(question_contexts)}
        
        Find the 3 most similar questions and return as JSON with format:
        {{"similar_questions": [{{"id": 1, "title": "...", "reason": "..."}}]}}
        """
        
        response = model.generate_content(prompt)
        
        try:
            suggestions = json.loads(response.text)
            return jsonify(suggestions)
        except json.JSONDecodeError:
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
    
    if not os.getenv('GEMINI_API_KEY'):
        return jsonify({'message': 'AI features not available'}), 503
    
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

# Web routes (serve the React frontend)
@app.route('/')
@app.route('/questions/<int:question_id>')
def serve_frontend(question_id=None):
    """Serve the React frontend for all routes."""
    # In a real deployment, this would serve static files
    # For now, we'll redirect to the API endpoints
    return jsonify({
        'message': 'StackIt Python Backend API',
        'status': 'running',
        'endpoints': {
            'auth': '/api/auth/*',
            'questions': '/api/questions/*',
            'notifications': '/api/notifications/*',
            'ai': '/api/ai/*'
        }
    })

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({'message': 'Resource not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'message': 'Internal server error'}), 500

if __name__ == '__main__':
    with app.app_context():
        # Create tables if they don't exist
        db.create_all()
    
    print("🚀 StackIt Python Backend starting...")
    print("📊 Database:", os.getenv('DATABASE_URL', 'Not configured'))
    print("🤖 AI Features:", "Enabled" if os.getenv('GEMINI_API_KEY') else "Disabled")
    
    app.run(debug=True, host='0.0.0.0', port=5001)