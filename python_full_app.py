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
    tags = StringField('Tags (comma-separated)', validators=[DataRequired(), Length(min=1, message='At least one tag is required')])
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
        
        # Check for @username mentions in the answer content
        import re
        mentions = re.findall(r'@(\w+)', form.content.data)
        for username in mentions:
            mentioned_user = User.query.filter_by(username=username).first()
            if mentioned_user and mentioned_user.id != session['user_id']:
                mention_notification = Notification(
                    user_id=mentioned_user.id,
                    type='mention',
                    title=f'You were mentioned in an answer',
                    message=f'@{get_current_user().username} mentioned you in an answer to "{question.title}"',
                    question_id=question_id,
                    answer_id=answer.id
                )
                db.session.add(mention_notification)
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
    
    # Update vote scores and create upvote notifications
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
        
        # Create notification for upvote on answer
        if vote_type == 'up' and answer.author_id != session['user_id']:
            upvote_notification = Notification(
                user_id=answer.author_id,
                type='upvote',
                title='Your answer was upvoted',
                message=f'Someone upvoted your answer to "{answer.question.title}"',
                question_id=answer.question_id,
                answer_id=answer_id
            )
            db.session.add(upvote_notification)
        
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

# Notification routes
@app.route('/notifications')
@login_required
def notifications():
    """Show user notifications."""
    notifications = Notification.query.filter_by(user_id=session['user_id']).order_by(Notification.created_at.desc()).all()
    
    # Mark all notifications as read
    for notification in notifications:
        notification.is_read = True
    db.session.commit()
    
    return render_template('notifications.html', notifications=notifications, current_user=get_current_user())

@app.route('/notifications/count')
@login_required
def notification_count():
    """Get unread notification count."""
    count = Notification.query.filter_by(user_id=session['user_id'], is_read=False).count()
    return jsonify({'count': count})

@app.route('/notifications/<int:notification_id>/mark_read')
@login_required
def mark_notification_read(notification_id):
    """Mark a specific notification as read."""
    notification = Notification.query.get_or_404(notification_id)
    if notification.user_id == session['user_id']:
        notification.is_read = True
        db.session.commit()
    return jsonify({'success': True})

# Tags routes
@app.route('/tags')
def tags():
    """Show all tags."""
    # Get all tags from questions
    questions = Question.query.all()
    all_tags = set()
    
    for question in questions:
        question_tags = question.get_tags()
        all_tags.update(question_tags)
    
    # Convert to list and sort
    tag_list = sorted(list(all_tags))
    
    return render_template('tags.html', tags=tag_list, current_user=get_current_user())

@app.route('/tags/<tag>')
def tag_questions(tag):
    """Show questions with a specific tag."""
    questions = Question.query.all()
    filtered_questions = []
    
    for question in questions:
        if tag in question.get_tags():
            filtered_questions.append(question)
    
    return render_template('tag_questions.html', 
                         questions=filtered_questions, 
                         tag=tag,
                         current_user=get_current_user())

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
    
    # Base template with enhanced features
    base_template = '''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{% block title %}StackIt - Python Q&A Platform{% endblock %}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; background: #f8f9fa; }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { background: #2c3e50; color: white; padding: 1rem 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .nav { display: flex; justify-content: space-between; align-items: center; }
        .nav-left { display: flex; align-items: center; }
        .nav-right { display: flex; align-items: center; gap: 15px; }
        .nav a { color: white; text-decoration: none; padding: 8px 12px; border-radius: 4px; transition: background 0.2s; }
        .nav a:hover { background: #34495e; }
        .logo { font-size: 1.5rem; font-weight: bold; }
        
        /* Notification Bell */
        .notification-bell { position: relative; cursor: pointer; }
        .notification-bell::before { content: "🔔"; font-size: 1.2em; }
        .notification-badge { position: absolute; top: -5px; right: -5px; background: #e74c3c; color: white; 
                             border-radius: 50%; width: 18px; height: 18px; font-size: 10px; display: flex; 
                             align-items: center; justify-content: center; font-weight: bold; }
        
        /* Buttons */
        .btn { background: #3498db; color: white; padding: 10px 20px; border: none; text-decoration: none; 
               border-radius: 4px; cursor: pointer; font-size: 14px; transition: all 0.2s; display: inline-block; }
        .btn:hover { background: #2980b9; text-decoration: none; color: white; }
        .btn-success { background: #27ae60; }
        .btn-success:hover { background: #219a52; }
        .btn-danger { background: #e74c3c; }
        .btn-danger:hover { background: #c0392b; }
        .btn-sm { padding: 6px 12px; font-size: 12px; }
        
        /* Cards */
        .card { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; 
                box-shadow: 0 2px 8px rgba(0,0,0,0.1); border: 1px solid #e9ecef; }
        
        /* Forms */
        .form-group { margin: 15px 0; }
        .form-group label { display: block; margin-bottom: 5px; font-weight: 600; color: #2c3e50; }
        .form-group input, .form-group textarea, .form-group select { width: 100%; padding: 10px; border: 1px solid #ddd; 
                                                                      border-radius: 4px; font-size: 14px; }
        .form-group input:focus, .form-group textarea:focus { outline: none; border-color: #3498db; }
        
        /* Alerts */
        .alert { padding: 12px; margin: 10px 0; border-radius: 4px; border-left: 4px solid; }
        .alert-success { background: #d4edda; color: #155724; border-color: #27ae60; }
        .alert-error { background: #f8d7da; color: #721c24; border-color: #e74c3c; }
        .alert-info { background: #cce7ff; color: #004085; border-color: #3498db; }
        
        /* Questions */
        .question-item { border-bottom: 1px solid #e9ecef; padding: 20px 0; display: flex; }
        .question-item:last-child { border-bottom: none; }
        .question-content { flex: 1; }
        .question-title { font-size: 1.1rem; font-weight: 600; margin-bottom: 8px; }
        .question-title a { color: #2c3e50; text-decoration: none; }
        .question-title a:hover { color: #3498db; }
        .question-excerpt { color: #6c757d; margin-bottom: 10px; }
        
        /* Tags */
        .tags { margin: 10px 0; }
        .tag { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; 
               padding: 4px 10px; margin: 2px 4px 2px 0; border-radius: 12px; font-size: 11px; 
               font-weight: 500; text-decoration: none; display: inline-block; transition: all 0.2s; }
        .tag:hover { transform: translateY(-1px); box-shadow: 0 2px 4px rgba(0,0,0,0.2); color: white; }
        .tag-input { background: #f8f9fa; border: 1px solid #dee2e6; padding: 8px; border-radius: 4px; 
                     font-size: 12px; color: #6c757d; }
        
        /* Voting */
        .vote-buttons { display: flex; flex-direction: column; align-items: center; margin-right: 20px; min-width: 60px; }
        .vote-btn { background: #f8f9fa; border: 1px solid #dee2e6; padding: 8px 12px; cursor: pointer; 
                    border-radius: 4px; margin: 2px 0; transition: all 0.2s; font-size: 16px; }
        .vote-btn:hover { background: #e9ecef; }
        .vote-btn.active { background: #3498db; color: white; }
        .vote-score { font-weight: bold; margin: 8px 0; font-size: 16px; text-align: center; }
        
        /* Meta info */
        .meta { color: #6c757d; font-size: 12px; margin-top: 10px; }
        .meta a { color: #3498db; text-decoration: none; }
        .meta a:hover { text-decoration: underline; }
        
        /* Answers */
        .answer { border-left: 3px solid #dee2e6; padding-left: 20px; margin: 20px 0; }
        .answer.accepted { border-left-color: #27ae60; background: #f8fff8; }
        .accept-btn { background: #27ae60; color: white; padding: 6px 12px; border: none; 
                      border-radius: 4px; cursor: pointer; font-size: 12px; }
        
        /* Search and filters */
        .search-box { padding: 12px; margin: 10px 0; width: 100%; border: 1px solid #dee2e6; 
                      border-radius: 4px; font-size: 14px; }
        .filters { margin: 20px 0; }
        .filter-btn { background: #f8f9fa; color: #495057; padding: 8px 16px; border: 1px solid #dee2e6; 
                      text-decoration: none; margin: 0 5px; border-radius: 4px; transition: all 0.2s; }
        .filter-btn:hover { background: #e9ecef; }
        .filter-btn.active { background: #3498db; color: white; border-color: #3498db; }
        
        /* Responsive */
        @media (max-width: 768px) {
            .container { padding: 10px; }
            .question-item { flex-direction: column; }
            .vote-buttons { flex-direction: row; margin-right: 0; margin-bottom: 10px; }
            .nav-right { gap: 10px; }
        }
    </style>
    <script>
        // Notification badge update
        function updateNotificationBadge() {
            fetch('/notifications/count')
                .then(response => response.json())
                .then(data => {
                    const badge = document.querySelector('.notification-badge');
                    if (data.count > 0) {
                        badge.textContent = data.count;
                        badge.style.display = 'flex';
                    } else {
                        badge.style.display = 'none';
                    }
                })
                .catch(error => console.error('Error updating notification badge:', error));
        }
        
        // Update badge on page load and every 30 seconds
        document.addEventListener('DOMContentLoaded', function() {
            if (document.querySelector('.notification-bell')) {
                updateNotificationBadge();
                setInterval(updateNotificationBadge, 30000);
            }
        });
    </script>
</head>
<body>
    <div class="header">
        <div class="container">
            <div class="nav">
                <div class="nav-left">
                    <a href="{{ url_for('index') }}" class="logo">StackIt</a>
                    <a href="{{ url_for('tags') }}">Tags</a>
                </div>
                <div class="nav-right">
                    {% if current_user %}
                        <a href="{{ url_for('ask_question') }}" class="btn btn-sm">Ask Question</a>
                        <a href="{{ url_for('notifications') }}" class="notification-bell">
                            <span class="notification-badge">0</span>
                        </a>
                        <span>{{ current_user.get_full_name() }}</span>
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
    
    # Index template - enhanced with public access
    index_template = '''{% extends "base.html" %}
{% block content %}
<div class="card">
    <h1>Welcome to StackIt</h1>
    <p>A community-driven Q&A platform where knowledge is shared freely.</p>
    {% if not current_user %}
        <p><strong>Browse all questions and answers below, or <a href="{{ url_for('login') }}">login</a> to ask questions and participate!</strong></p>
    {% endif %}
</div>

<div class="card">
    <form method="GET" action="{{ url_for('index') }}">
        <input type="search" name="search" placeholder="Search questions..." value="{{ search }}" class="search-box">
    </form>
    
    <div class="filters">
        <a href="{{ url_for('index', filter='newest') }}" class="filter-btn {{ 'active' if filter_type == 'newest' else '' }}">Newest</a>
        <a href="{{ url_for('index', filter='unanswered') }}" class="filter-btn {{ 'active' if filter_type == 'unanswered' else '' }}">Unanswered</a>
        <a href="{{ url_for('index') }}" class="filter-btn {{ 'active' if filter_type == 'all' else '' }}">All</a>
    </div>
</div>

<div class="card">
    <h2>Questions</h2>
    {% if questions.items %}
        {% for question in questions.items %}
            <div class="question-item">
                <div class="vote-buttons">
                    <div class="vote-score">{{ question.vote_score }}</div>
                    <div style="font-size: 10px; color: #6c757d;">votes</div>
                </div>
                <div class="question-content">
                    <h3 class="question-title">
                        <a href="{{ url_for('question_detail', question_id=question.id) }}">{{ question.title }}</a>
                    </h3>
                    <p class="question-excerpt">{{ question.description[:150] }}{% if question.description|length > 150 %}...{% endif %}</p>
                    
                    {% if question.get_tags() %}
                        <div class="tags">
                            {% for tag in question.get_tags() %}
                                <a href="{{ url_for('tag_questions', tag=tag) }}" class="tag">{{ tag }}</a>
                            {% endfor %}
                        </div>
                    {% endif %}
                    
                    <div class="meta">
                        <span>{{ question.time_ago() }}</span> by 
                        <a href="#">{{ question.author.get_full_name() }}</a> • 
                        <span>{{ question.get_answer_count() }} answers</span> • 
                        <span>{{ question.view_count }} views</span>
                    </div>
                </div>
            </div>
        {% endfor %}
        
        <!-- Pagination -->
        {% if questions.pages > 1 %}
            <div style="margin-top: 20px;">
                {% if questions.has_prev %}
                    <a href="{{ url_for('index', page=questions.prev_num, search=search, filter=filter_type) }}" class="btn">Previous</a>
                {% endif %}
                {% if questions.has_next %}
                    <a href="{{ url_for('index', page=questions.next_num, search=search, filter=filter_type) }}" class="btn">Next</a>
                {% endif %}
            </div>
        {% endif %}
    {% else %}
        <p>No questions found. {% if current_user %}<a href="{{ url_for('ask_question') }}">Be the first to ask!</a>{% endif %}</p>
    {% endif %}
</div>
{% endblock %}'''

    # Notifications template
    notifications_template = '''{% extends "base.html" %}
{% block content %}
<div class="card">
    <h2>Your Notifications</h2>
    {% if notifications %}
        {% for notification in notifications %}
            <div class="question-item">
                <div class="question-content">
                    <h4>{{ notification.title }}</h4>
                    <p>{{ notification.message }}</p>
                    <div class="meta">
                        <span>{{ notification.created_at.strftime('%B %d, %Y at %I:%M %p') }}</span>
                        {% if notification.question_id %}
                            • <a href="{{ url_for('question_detail', question_id=notification.question_id) }}">View Question</a>
                        {% endif %}
                    </div>
                </div>
            </div>
        {% endfor %}
    {% else %}
        <p>No notifications yet.</p>
    {% endif %}
</div>
{% endblock %}'''

    # Tags template
    tags_template = '''{% extends "base.html" %}
{% block content %}
<div class="card">
    <h2>All Tags</h2>
    <p>Browse questions by topic</p>
    {% if tags %}
        <div class="tags" style="margin-top: 20px;">
            {% for tag in tags %}
                <a href="{{ url_for('tag_questions', tag=tag) }}" class="tag">{{ tag }}</a>
            {% endfor %}
        </div>
    {% else %}
        <p>No tags available yet.</p>
    {% endif %}
</div>
{% endblock %}'''

    # Ask question template - enhanced with required tags
    ask_question_template = '''{% extends "base.html" %}
{% block content %}
<div class="card">
    <h2>Ask a Question</h2>
    <form method="POST">
        {{ form.hidden_tag() }}
        
        <div class="form-group">
            {{ form.title.label }}
            {{ form.title(class="form-control") }}
            {% if form.title.errors %}
                <div class="alert alert-error">
                    {% for error in form.title.errors %}
                        {{ error }}
                    {% endfor %}
                </div>
            {% endif %}
        </div>
        
        <div class="form-group">
            {{ form.description.label }}
            {{ form.description(class="form-control", rows="8") }}
            {% if form.description.errors %}
                <div class="alert alert-error">
                    {% for error in form.description.errors %}
                        {{ error }}
                    {% endfor %}
                </div>
            {% endif %}
        </div>
        
        <div class="form-group">
            {{ form.tags.label }}
            {{ form.tags(class="form-control", placeholder="Enter tags separated by commas (e.g., python, web-development, database)") }}
            <small class="tag-input">At least one tag is required. Use existing tags or create new ones.</small>
            {% if form.tags.errors %}
                <div class="alert alert-error">
                    {% for error in form.tags.errors %}
                        {{ error }}
                    {% endfor %}
                </div>
            {% endif %}
        </div>
        
        <div class="form-group">
            {{ form.submit(class="btn btn-success") }}
            <a href="{{ url_for('index') }}" class="btn">Cancel</a>
        </div>
    </form>
</div>
{% endblock %}'''

    # Question detail template - enhanced with voting and tags
    question_detail_template = '''{% extends "base.html" %}
{% block content %}
<div class="card">
    <div class="question-item">
        <div class="vote-buttons">
            {% if current_user %}
                <button class="vote-btn" onclick="vote('up', {{ question.id }}, null)">▲</button>
            {% else %}
                <div class="vote-btn" title="Login to vote">▲</div>
            {% endif %}
            <div class="vote-score" id="question-score-{{ question.id }}">{{ question.vote_score }}</div>
            {% if current_user %}
                <button class="vote-btn" onclick="vote('down', {{ question.id }}, null)">▼</button>
            {% else %}
                <div class="vote-btn" title="Login to vote">▼</div>
            {% endif %}
        </div>
        <div class="question-content">
            <h1>{{ question.title }}</h1>
            <div style="margin: 20px 0;">{{ question.description | safe }}</div>
            
            {% if question.get_tags() %}
                <div class="tags">
                    {% for tag in question.get_tags() %}
                        <a href="{{ url_for('tag_questions', tag=tag) }}" class="tag">{{ tag }}</a>
                    {% endfor %}
                </div>
            {% endif %}
            
            <div class="meta">
                <span>{{ question.time_ago() }}</span> by 
                <a href="#">{{ question.author.get_full_name() }}</a> • 
                <span>{{ question.view_count }} views</span>
            </div>
        </div>
    </div>
</div>

<div class="card">
    <h3>{{ answers | length }} Answers</h3>
    {% for answer in answers %}
        <div class="answer {{ 'accepted' if answer.is_accepted else '' }}">
            <div class="question-item">
                <div class="vote-buttons">
                    {% if current_user %}
                        <button class="vote-btn" onclick="vote('up', null, {{ answer.id }})">▲</button>
                    {% else %}
                        <div class="vote-btn" title="Login to vote">▲</div>
                    {% endif %}
                    <div class="vote-score" id="answer-score-{{ answer.id }}">{{ answer.vote_score }}</div>
                    {% if current_user %}
                        <button class="vote-btn" onclick="vote('down', null, {{ answer.id }})">▼</button>
                    {% else %}
                        <div class="vote-btn" title="Login to vote">▼</div>
                    {% endif %}
                </div>
                <div class="question-content">
                    <p>{{ answer.content | safe }}</p>
                    
                    <div class="meta">
                        <span>{{ answer.time_ago() }}</span> by 
                        <a href="#">{{ answer.author.get_full_name() }}</a>
                        {% if current_user and current_user.id == question.author_id and not answer.is_accepted %}
                            <a href="{{ url_for('accept_answer', answer_id=answer.id) }}" class="accept-btn">Accept Answer</a>
                        {% endif %}
                        {% if answer.is_accepted %}
                            <span style="color: #27ae60; font-weight: bold;">✓ Accepted</span>
                        {% endif %}
                    </div>
                </div>
            </div>
        </div>
    {% endfor %}
</div>

{% if current_user %}
    <div class="card">
        <h3>Your Answer</h3>
        <form method="POST" action="{{ url_for('post_answer', question_id=question.id) }}">
            {{ form.hidden_tag() }}
            
            <div class="form-group">
                {{ form.content.label }}
                {{ form.content(class="form-control", rows="6", placeholder="Write your answer here... You can mention other users with @username") }}
                {% if form.content.errors %}
                    <div class="alert alert-error">
                        {% for error in form.content.errors %}
                            {{ error }}
                        {% endfor %}
                    </div>
                {% endif %}
            </div>
            
            <div class="form-group">
                {{ form.submit(class="btn btn-success") }}
            </div>
        </form>
    </div>
{% else %}
    <div class="card">
        <p><a href="{{ url_for('login') }}">Login</a> to post an answer.</p>
    </div>
{% endif %}

<script>
function vote(voteType, questionId, answerId) {
    fetch('/vote', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            vote_type: voteType,
            question_id: questionId,
            answer_id: answerId
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.new_score !== undefined) {
            const scoreElement = document.getElementById(
                questionId ? `question-score-${questionId}` : `answer-score-${answerId}`
            );
            scoreElement.textContent = data.new_score;
        }
    })
    .catch(error => console.error('Error:', error));
}
</script>
{% endblock %}'''

    # Login template
    login_template = '''{% extends "base.html" %}
{% block content %}
<div class="card">
    <h2>Login</h2>
    <form method="POST">
        {{ form.hidden_tag() }}
        
        <div class="form-group">
            {{ form.username.label }}
            {{ form.username(class="form-control") }}
            {% if form.username.errors %}
                <div class="alert alert-error">
                    {% for error in form.username.errors %}
                        {{ error }}
                    {% endfor %}
                </div>
            {% endif %}
        </div>
        
        <div class="form-group">
            {{ form.password.label }}
            {{ form.password(class="form-control") }}
            {% if form.password.errors %}
                <div class="alert alert-error">
                    {% for error in form.password.errors %}
                        {{ error }}
                    {% endfor %}
                </div>
            {% endif %}
        </div>
        
        <div class="form-group">
            {{ form.submit(class="btn btn-success") }}
        </div>
    </form>
    
    <p>Don't have an account? <a href="{{ url_for('register') }}">Register here</a></p>
</div>
{% endblock %}'''

    # Register template
    register_template = '''{% extends "base.html" %}
{% block content %}
<div class="card">
    <h2>Register</h2>
    <form method="POST">
        {{ form.hidden_tag() }}
        
        <div class="form-group">
            {{ form.username.label }}
            {{ form.username(class="form-control") }}
            {% if form.username.errors %}
                <div class="alert alert-error">
                    {% for error in form.username.errors %}
                        {{ error }}
                    {% endfor %}
                </div>
            {% endif %}
        </div>
        
        <div class="form-group">
            {{ form.email.label }}
            {{ form.email(class="form-control") }}
            {% if form.email.errors %}
                <div class="alert alert-error">
                    {% for error in form.email.errors %}
                        {{ error }}
                    {% endfor %}
                </div>
            {% endif %}
        </div>
        
        <div class="form-group">
            {{ form.password.label }}
            {{ form.password(class="form-control") }}
            {% if form.password.errors %}
                <div class="alert alert-error">
                    {% for error in form.password.errors %}
                        {{ error }}
                    {% endfor %}
                </div>
            {% endif %}
        </div>
        
        <div class="form-group">
            {{ form.first_name.label }}
            {{ form.first_name(class="form-control") }}
        </div>
        
        <div class="form-group">
            {{ form.last_name.label }}
            {{ form.last_name(class="form-control") }}
        </div>
        
        <div class="form-group">
            {{ form.submit(class="btn btn-success") }}
        </div>
    </form>
    
    <p>Already have an account? <a href="{{ url_for('login') }}">Login here</a></p>
</div>
{% endblock %}'''

    # Write all templates
    templates = {
        'index.html': index_template,
        'notifications.html': notifications_template,
        'tags.html': tags_template,
        'ask_question.html': ask_question_template,
        'question_detail.html': question_detail_template,
        'login.html': login_template,
        'register.html': register_template
    }
    
    for filename, content in templates.items():
        with open(f'templates/{filename}', 'w') as f:
            f.write(content)
    
    return jsonify({'message': 'All templates created successfully with enhanced features'})

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