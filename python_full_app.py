#!/usr/bin/env python3
"""
StackIt - Complete Python Q&A Platform
A full-stack question and answer platform built entirely in Python with Flask.
"""

import os
import json
from datetime import datetime
from typing import Optional, List, Dict, Any
from flask import Flask, request, jsonify, session, render_template, redirect, url_for, flash
from flask_sqlalchemy import SQLAlchemy
from flask_wtf import FlaskForm
from wtforms import StringField, TextAreaField, PasswordField, SubmitField, SelectMultipleField
from wtforms.validators import DataRequired, Email, Length, Optional as OptionalValidator
from werkzeug.security import generate_password_hash, check_password_hash
import google.generativeai as genai
from dotenv import load_dotenv
from markupsafe import Markup

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['WTF_CSRF_ENABLED'] = True

# Initialize extensions
db = SQLAlchemy(app)

# Configure Gemini AI
if os.getenv('GEMINI_API_KEY'):
    genai.configure(api_key=os.getenv('GEMINI_API_KEY'))

# Database Models
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
    
    def get_full_name(self):
        if self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        return self.username

class Question(db.Model):
    __tablename__ = 'questions'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=False)
    author_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    tags = db.Column(db.Text, nullable=True)
    vote_score = db.Column(db.Integer, default=0)
    view_count = db.Column(db.Integer, default=0)
    accepted_answer_id = db.Column(db.Integer, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    author = db.relationship('User', backref='questions')
    answers = db.relationship('Answer', backref='question', lazy='dynamic')
    
    def get_tags(self):
        if self.tags:
            try:
                return json.loads(self.tags)
            except (json.JSONDecodeError, TypeError):
                return []
        return []
    
    def get_answer_count(self):
        return self.answers.count()
    
    def time_ago(self):
        diff = datetime.utcnow() - self.created_at
        if diff.days > 0:
            return f"{diff.days}d ago"
        elif diff.seconds > 3600:
            return f"{diff.seconds // 3600}h ago"
        else:
            return f"{diff.seconds // 60}m ago"

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
    
    def time_ago(self):
        diff = datetime.utcnow() - self.created_at
        if diff.days > 0:
            return f"{diff.days}d ago"
        elif diff.seconds > 3600:
            return f"{diff.seconds // 3600}h ago"
        else:
            return f"{diff.seconds // 60}m ago"

class Vote(db.Model):
    __tablename__ = 'votes'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    question_id = db.Column(db.Integer, db.ForeignKey('questions.id'), nullable=True)
    answer_id = db.Column(db.Integer, db.ForeignKey('answers.id'), nullable=True)
    vote_type = db.Column(db.String(10), nullable=False)
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

# Forms
class LoginForm(FlaskForm):
    username = StringField('Username', validators=[DataRequired()])
    password = PasswordField('Password', validators=[DataRequired()])
    submit = SubmitField('Login')

class RegisterForm(FlaskForm):
    username = StringField('Username', validators=[DataRequired(), Length(min=3, max=50)])
    email = StringField('Email', validators=[OptionalValidator(), Email()])
    password = PasswordField('Password', validators=[DataRequired(), Length(min=6)])
    first_name = StringField('First Name', validators=[OptionalValidator()])
    last_name = StringField('Last Name', validators=[OptionalValidator()])
    submit = SubmitField('Register')

class QuestionForm(FlaskForm):
    title = StringField('Title', validators=[DataRequired(), Length(min=10, max=200)])
    description = TextAreaField('Description', validators=[DataRequired(), Length(min=20)])
    tags = StringField('Tags (comma-separated)', validators=[OptionalValidator()])
    submit = SubmitField('Post Question')

class AnswerForm(FlaskForm):
    content = TextAreaField('Your Answer', validators=[DataRequired(), Length(min=10)])
    submit = SubmitField('Post Answer')

# Utility functions
def login_required(f):
    """Decorator to require login."""
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            flash('Please log in to access this page.', 'error')
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    decorated_function.__name__ = f.__name__
    return decorated_function

def get_current_user():
    """Get the current logged-in user."""
    if 'user_id' in session:
        return User.query.get(session['user_id'])
    return None

# Routes
@app.route('/')
def index():
    """Home page showing all questions."""
    page = request.args.get('page', 1, type=int)
    search = request.args.get('search', '')
    filter_type = request.args.get('filter', 'newest')
    
    query = Question.query
    
    if search:
        query = query.filter(Question.title.contains(search))
    
    if filter_type == 'unanswered':
        query = query.filter(~Question.answers.any())
    elif filter_type == 'newest':
        query = query.order_by(Question.created_at.desc())
    
    questions = query.paginate(
        page=page, 
        per_page=10, 
        error_out=False
    )
    
    return render_template('index.html', 
                         questions=questions, 
                         search=search, 
                         filter_type=filter_type,
                         current_user=get_current_user())

@app.route('/questions/<int:question_id>')
def question_detail(question_id):
    """Show question details with answers."""
    question = Question.query.get_or_404(question_id)
    
    # Increment view count
    question.view_count += 1
    db.session.commit()
    
    answers = Answer.query.filter_by(question_id=question_id).order_by(Answer.created_at.desc()).all()
    
    form = AnswerForm()
    
    return render_template('question_detail.html', 
                         question=question, 
                         answers=answers, 
                         form=form,
                         current_user=get_current_user())

@app.route('/ask', methods=['GET', 'POST'])
@login_required
def ask_question():
    """Ask a new question."""
    form = QuestionForm()
    
    if form.validate_on_submit():
        # Process tags
        tags = []
        if form.tags.data:
            tags = [tag.strip() for tag in form.tags.data.split(',') if tag.strip()]
        
        question = Question(
            title=form.title.data,
            description=form.description.data,
            author_id=session['user_id'],
            tags=json.dumps(tags) if tags else None
        )
        
        db.session.add(question)
        db.session.commit()
        
        flash('Your question has been posted!', 'success')
        return redirect(url_for('question_detail', question_id=question.id))
    
    return render_template('ask_question.html', form=form, current_user=get_current_user())

@app.route('/questions/<int:question_id>/answer', methods=['POST'])
@login_required
def post_answer(question_id):
    """Post an answer to a question."""
    question = Question.query.get_or_404(question_id)
    form = AnswerForm()
    
    if form.validate_on_submit():
        answer = Answer(
            content=form.content.data,
            question_id=question_id,
            author_id=session['user_id']
        )
        
        db.session.add(answer)
        db.session.commit()
        
        # Create notification for question author
        if question.author_id != session['user_id']:
            notification = Notification(
                user_id=question.author_id,
                type='answer',
                title='New answer to your question',
                message=f'Someone answered your question "{question.title}"',
                question_id=question_id,
                answer_id=answer.id
            )
            db.session.add(notification)
            db.session.commit()
        
        flash('Your answer has been posted!', 'success')
    else:
        flash('Please provide a valid answer.', 'error')
    
    return redirect(url_for('question_detail', question_id=question_id))

@app.route('/vote', methods=['POST'])
@login_required
def vote():
    """Handle voting on questions and answers."""
    data = request.get_json()
    
    vote_type = data.get('vote_type')
    question_id = data.get('question_id')
    answer_id = data.get('answer_id')
    
    if vote_type not in ['up', 'down']:
        return jsonify({'error': 'Invalid vote type'}), 400
    
    # Check if user already voted
    existing_vote = Vote.query.filter_by(
        user_id=session['user_id'],
        question_id=question_id,
        answer_id=answer_id
    ).first()
    
    if existing_vote:
        existing_vote.vote_type = vote_type
        existing_vote.updated_at = datetime.utcnow()
    else:
        new_vote = Vote(
            user_id=session['user_id'],
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
        db.session.commit()
        return jsonify({'new_score': question.vote_score})
    
    if answer_id:
        answer = Answer.query.get(answer_id)
        up_votes = Vote.query.filter_by(answer_id=answer_id, vote_type='up').count()
        down_votes = Vote.query.filter_by(answer_id=answer_id, vote_type='down').count()
        answer.vote_score = up_votes - down_votes
        db.session.commit()
        return jsonify({'new_score': answer.vote_score})
    
    return jsonify({'error': 'Invalid vote target'}), 400

@app.route('/accept_answer/<int:answer_id>')
@login_required
def accept_answer(answer_id):
    """Accept an answer."""
    answer = Answer.query.get_or_404(answer_id)
    question = answer.question
    
    # Check if user is the question author
    if question.author_id != session['user_id']:
        flash('You can only accept answers to your own questions.', 'error')
        return redirect(url_for('question_detail', question_id=question.id))
    
    # Unaccept previous answer
    if question.accepted_answer_id:
        prev_answer = Answer.query.get(question.accepted_answer_id)
        if prev_answer:
            prev_answer.is_accepted = False
    
    # Accept new answer
    answer.is_accepted = True
    question.accepted_answer_id = answer_id
    
    db.session.commit()
    
    flash('Answer accepted!', 'success')
    return redirect(url_for('question_detail', question_id=question.id))

# Authentication routes
@app.route('/login', methods=['GET', 'POST'])
def login():
    """User login."""
    if get_current_user():
        return redirect(url_for('index'))
    
    form = LoginForm()
    
    if form.validate_on_submit():
        user = User.query.filter_by(username=form.username.data).first()
        
        if user and check_password_hash(user.password_hash, form.password.data):
            session['user_id'] = user.id
            flash('Successfully logged in!', 'success')
            return redirect(url_for('index'))
        else:
            flash('Invalid username or password.', 'error')
    
    return render_template('login.html', form=form)

@app.route('/register', methods=['GET', 'POST'])
def register():
    """User registration."""
    if get_current_user():
        return redirect(url_for('index'))
    
    form = RegisterForm()
    
    if form.validate_on_submit():
        # Check if username exists
        if User.query.filter_by(username=form.username.data).first():
            flash('Username already exists.', 'error')
            return render_template('register.html', form=form)
        
        # Check if email exists
        if form.email.data and User.query.filter_by(email=form.email.data).first():
            flash('Email already exists.', 'error')
            return render_template('register.html', form=form)
        
        # Create new user
        user = User(
            username=form.username.data,
            email=form.email.data if form.email.data else None,
            password_hash=generate_password_hash(form.password.data),
            first_name=form.first_name.data if form.first_name.data else None,
            last_name=form.last_name.data if form.last_name.data else None
        )
        
        db.session.add(user)
        db.session.commit()
        
        session['user_id'] = user.id
        flash('Registration successful!', 'success')
        return redirect(url_for('index'))
    
    return render_template('register.html', form=form)

@app.route('/logout')
def logout():
    """User logout."""
    session.pop('user_id', None)
    flash('You have been logged out.', 'info')
    return redirect(url_for('index'))

# AI Features
@app.route('/ai/improve_text', methods=['POST'])
@login_required
def ai_improve_text():
    """Improve text using AI."""
    if not os.getenv('GEMINI_API_KEY'):
        return jsonify({'error': 'AI features not available'}), 503
    
    data = request.get_json()
    text = data.get('text', '')
    
    if not text:
        return jsonify({'error': 'No text provided'}), 400
    
    try:
        model = genai.GenerativeModel('gemini-2.5-flash')
        prompt = f"Improve the grammar and clarity of this text: {text}"
        response = model.generate_content(prompt)
        
        return jsonify({'improved_text': response.text})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Create HTML templates
@app.route('/create_templates')
def create_templates():
    """Create HTML templates for the application."""
    
    # Create templates directory
    os.makedirs('templates', exist_ok=True)
    
    # Base template
    base_template = '''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{% block title %}StackIt - Python Q&A Platform{% endblock %}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f4f4f4; }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { background: #2c3e50; color: white; padding: 1rem 0; }
        .nav { display: flex; justify-content: space-between; align-items: center; }
        .nav a { color: white; text-decoration: none; margin: 0 10px; padding: 5px 10px; }
        .nav a:hover { background: #34495e; border-radius: 3px; }
        .btn { background: #3498db; color: white; padding: 10px 20px; border: none; text-decoration: none; border-radius: 3px; cursor: pointer; }
        .btn:hover { background: #2980b9; }
        .btn-success { background: #27ae60; }
        .btn-success:hover { background: #219a52; }
        .card { background: white; padding: 20px; margin: 20px 0; border-radius: 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
        .form-group { margin: 15px 0; }
        .form-group label { display: block; margin-bottom: 5px; font-weight: bold; }
        .form-group input, .form-group textarea { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 3px; }
        .alert { padding: 10px; margin: 10px 0; border-radius: 3px; }
        .alert-success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
        .alert-error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
        .alert-info { background: #cce7ff; color: #004085; border: 1px solid #b6d7ff; }
        .question-item { border-bottom: 1px solid #eee; padding: 15px 0; }
        .question-item:last-child { border-bottom: none; }
        .vote-buttons { display: flex; flex-direction: column; align-items: center; margin-right: 15px; }
        .vote-btn { background: #ecf0f1; border: 1px solid #bdc3c7; padding: 5px 10px; cursor: pointer; }
        .vote-btn:hover { background: #d5dbdb; }
        .vote-score { font-weight: bold; margin: 5px 0; }
        .tags { margin: 10px 0; }
        .tag { background: #e8f4f8; color: #2980b9; padding: 2px 8px; margin: 2px; border-radius: 3px; font-size: 12px; }
        .meta { color: #7f8c8d; font-size: 12px; margin-top: 10px; }
        .answer { border-left: 3px solid #3498db; padding-left: 15px; margin: 20px 0; }
        .accepted { border-left-color: #27ae60; }
        .accept-btn { background: #27ae60; color: white; padding: 5px 10px; border: none; border-radius: 3px; cursor: pointer; }
        .search-box { padding: 10px; margin: 10px 0; width: 100%; border: 1px solid #ddd; border-radius: 3px; }
        .filters { margin: 20px 0; }
        .filter-btn { background: #ecf0f1; color: #2c3e50; padding: 8px 15px; border: 1px solid #bdc3c7; text-decoration: none; margin: 0 5px; border-radius: 3px; }
        .filter-btn.active { background: #3498db; color: white; }
    </style>
</head>
<body>
    <div class="header">
        <div class="container">
            <div class="nav">
                <div>
                    <a href="{{ url_for('index') }}"><strong>StackIt</strong></a>
                </div>
                <div>
                    {% if current_user %}
                        <a href="{{ url_for('ask_question') }}">Ask Question</a>
                        <span>Welcome, {{ current_user.get_full_name() }}!</span>
                        <a href="{{ url_for('logout') }}">Logout</a>
                    {% else %}
                        <a href="{{ url_for('login') }}">Login</a>
                        <a href="{{ url_for('register') }}">Register</a>
                    {% endif %}
                </div>
            </div>
        </div>
    </div>
    
    <div class="container">
        {% with messages = get_flashed_messages(with_categories=true) %}
            {% if messages %}
                {% for category, message in messages %}
                    <div class="alert alert-{{ 'error' if category == 'error' else category }}">
                        {{ message }}
                    </div>
                {% endfor %}
            {% endif %}
        {% endwith %}
        
        {% block content %}{% endblock %}
    </div>
</body>
</html>'''
    
    with open('templates/base.html', 'w') as f:
        f.write(base_template)
    
    return jsonify({'message': 'Templates created successfully'})

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    
    # Create templates on startup
    os.makedirs('templates', exist_ok=True)
    
    print("🐍 StackIt Python Full-Stack App starting...")
    print("📊 Database:", os.getenv('DATABASE_URL', 'Not configured'))
    print("🤖 AI Features:", "Enabled" if os.getenv('GEMINI_API_KEY') else "Disabled")
    print("🌐 Access at: http://localhost:5002")
    
    app.run(debug=True, host='0.0.0.0', port=5002)