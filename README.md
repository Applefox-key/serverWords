# serverWords

Backend API for the LearnyPie language learning applications.

This server provides authentication, data management, learning workflows, and API endpoints used by multiple frontend applications in the LearnyPie project ecosystem.

🌐 **Frontend applications:**

- [FlashMinds](https://flashcards.learnypie.com/)
- [SayLoop](https://phrasely.learnypie.com/)
- [LearnyPie](https://learnypie.com/)

---

## Features

### Authentication

- User registration and login
- Cookie-based authentication
- Token-based authorization
- Google OAuth
- Password reset functionality
- Role-based access

### Learning Content

The API supports management of:

- Expressions and phrases
- Collections
- Flashcard content
- Categories
- Labels and tags
- Playlists
- Images and avatars

### Spaced Repetition

The backend stores and manages learning data including:

- Review intervals
- Ease factors
- Repetition history
- Next review dates
- Review results

It also supports automatic daily queue updates for learning workflows.

### User Data

The API manages user-specific data such as:

- Learning content
- Settings
- Progress
- Daily activity statistics
- Review history

### Administrative Features

- Admin routes
- User management
- Application data management

---

## API Architecture

The application is built with Express and organized around domain-specific routes.
