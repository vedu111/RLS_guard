# 🛡️ RLS Guard Dog

A secure classroom progress tracking web application built with React, TypeScript, and Supabase. This application demonstrates Row-Level Security (RLS) implementation where students can only view their own progress while teachers can manage all classroom data.

![RLS Guard Dog](https://img.shields.io/badge/React-19.1.1-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue) ![Supabase](https://img.shields.io/badge/Supabase-2.57.4-green) ![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.1.13-cyan) ![Vite](https://img.shields.io/badge/Vite-7.1.2-purple)

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Database Schema](#-database-schema)
- [Security Model](#-security-model)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Usage](#-usage)
- [API Reference](#-api-reference)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)

## ✨ Features

### 🔐 Authentication & Authorization
- **Secure Authentication**: Email/password authentication with Supabase Auth
- **Role-Based Access Control**: Separate interfaces for students and teachers
- **Session Management**: Persistent sessions with automatic token refresh
- **Email Verification**: Account verification through email confirmation

### 👨‍🎓 Student Features
- **Personal Dashboard**: View individual progress across all subjects
- **Classroom Information**: Access classroom details and teacher information
- **Progress Tracking**: Real-time updates of academic progress
- **Profile Management**: Update personal information

### 👨‍🏫 Teacher Features
- **Teacher Dashboard**: Overview of all students' progress with statistics
- **Classroom Management**: Create, edit, and delete classrooms
- **Progress Management**: Add, edit, and delete student progress records
- **Student Analytics**: View completion rates, average scores, and progress trends

### 🎨 Modern UI/UX
- **Glassmorphism Design**: Modern semi-transparent UI elements
- **Responsive Layout**: Works seamlessly on desktop, tablet, and mobile
- **Dark Theme**: Beautiful gradient backgrounds with animated elements
- **Real-time Updates**: Live data synchronization across all components
- **Smooth Animations**: Polished transitions and hover effects

### 🔒 Security Features
- **Row-Level Security (RLS)**: Database-level security policies
- **Data Isolation**: Students can only access their own data
- **Secure API**: All database operations go through Supabase with RLS
- **Input Validation**: Client and server-side validation
- **Error Handling**: Comprehensive error handling and user feedback

## 🛠️ Tech Stack

### Frontend
- **React 19.1.1** - Modern React with latest features
- **TypeScript 5.8.3** - Type-safe JavaScript
- **Vite 7.1.2** - Fast build tool and development server
- **TailwindCSS 4.1.13** - Utility-first CSS framework
- **PostCSS** - CSS processing and optimization

### Backend & Database
- **Supabase 2.57.4** - Backend-as-a-Service platform
- **PostgreSQL** - Relational database with RLS
- **Row-Level Security** - Database-level access control
- **Real-time Subscriptions** - Live data updates

### Development Tools
- **ESLint** - Code linting and formatting
- **Vitest** - Unit and integration testing
- **TypeScript ESLint** - TypeScript-specific linting rules

## 🏗️ Architecture

### Project Structure
```
rls-guard-dog/
├── src/
│   ├── components/          # React components
│   │   ├── AuthPage.tsx     # Authentication landing page
│   │   ├── LoginForm.tsx    # User login form
│   │   ├── SignupForm.tsx   # User registration form
│   │   ├── AppRouter.tsx    # Main application router
│   │   ├── Navigation.tsx   # Navigation bar
│   │   ├── ProtectedRoute.tsx # Route protection
│   │   ├── StudentDashboard.tsx # Student main view
│   │   ├── ClassroomInfo.tsx # Student classroom info
│   │   ├── StudentProfile.tsx # Student profile management
│   │   ├── TeacherDashboard.tsx # Teacher main view
│   │   ├── ManageClassrooms.tsx # Classroom management
│   │   └── ManageProgress.tsx # Progress management
│   ├── contexts/
│   │   └── AuthContext.tsx  # Authentication context
│   ├── hooks/
│   │   └── useAuth.ts       # Authentication hook
│   ├── lib/
│   │   └── supabaseClient.ts # Supabase client configuration
│   ├── App.tsx              # Main application component
│   ├── main.tsx             # Application entry point
│   └── index.css            # Global styles
├── tests/                   # Test files
├── package.json             # Dependencies and scripts
├── tailwind.config.js       # TailwindCSS configuration
├── vite.config.ts           # Vite configuration
└── README.md               # Project documentation
```

### Component Architecture
- **Context Pattern**: Centralized authentication state management
- **Custom Hooks**: Reusable authentication logic
- **Component Composition**: Modular, reusable UI components
- **Type Safety**: Full TypeScript coverage with proper interfaces

## 🗄️ Database Schema

### Tables

#### `users` Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('student', 'teacher')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `classroom` Table
```sql
CREATE TABLE classroom (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  schedule TEXT NOT NULL,
  room_number TEXT NOT NULL,
  teacher_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `progress` Table
```sql
CREATE TABLE progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  classroom_id UUID REFERENCES classroom(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  status TEXT NOT NULL CHECK (status IN ('not-started', 'in-progress', 'completed')),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Row-Level Security Policies

#### Users Table Policies
```sql
-- Students can view their own profile
CREATE POLICY "Students can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

-- Teachers can view all profiles
CREATE POLICY "Teachers can view all profiles" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'teacher'
    )
  );

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);
```

#### Progress Table Policies
```sql
-- Students can view their own progress
CREATE POLICY "Students can view own progress" ON progress
  FOR SELECT USING (auth.uid() = user_id);

-- Teachers can view all progress
CREATE POLICY "Teachers can view all progress" ON progress
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'teacher'
    )
  );

-- Teachers can manage all progress
CREATE POLICY "Teachers can manage progress" ON progress
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'teacher'
    )
  );
```

## 🔒 Security Model

### Row-Level Security (RLS)
- **Database-Level Security**: Policies enforced at the PostgreSQL level
- **Role-Based Access**: Different permissions for students and teachers
- **Data Isolation**: Students cannot access other students' data
- **Secure by Default**: All tables have RLS enabled

### Authentication Flow
1. **User Registration**: Email/password signup with role selection
2. **Email Verification**: Account activation through email confirmation
3. **Session Management**: JWT tokens with automatic refresh
4. **Role Assignment**: Proper role assignment during profile creation

### Data Protection
- **Input Validation**: Client and server-side validation
- **SQL Injection Prevention**: Parameterized queries through Supabase
- **XSS Protection**: React's built-in XSS protection
- **CSRF Protection**: SameSite cookies and CSRF tokens

## 🚀 Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/rls-guard-dog.git
cd rls-guard-dog
```

### 2. Install Dependencies
```bash
npm install
# or
yarn install
```

### 3. Environment Setup
Create a `.env.local` file in the root directory:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Database Setup
1. Create a new Supabase project
2. Run the SQL schema provided in the [Database Schema](#-database-schema) section
3. Enable Row-Level Security on all tables
4. Create the RLS policies as shown above

### 5. Start Development Server
```bash
npm run dev
# or
yarn dev
```

The application will be available at `http://localhost:5173`

## ⚙️ Configuration

### Supabase Configuration
1. **Project Setup**: Create a new Supabase project
2. **Database Schema**: Run the provided SQL schema
3. **RLS Policies**: Implement the security policies
4. **Authentication**: Configure email templates and settings

### Environment Variables
```env
# Required
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Optional (for testing)
TEST_SUPABASE_URL=https://your-project.supabase.co
TEST_SUPABASE_ANON_KEY=your-anon-key
TEST_STUDENT_EMAIL=student@example.com
TEST_STUDENT_PASSWORD=password123
TEST_TEACHER_EMAIL=teacher@example.com
TEST_TEACHER_PASSWORD=password123
```

### TailwindCSS Configuration
The project uses TailwindCSS v4 with custom configuration:
```javascript
// tailwind.config.js
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Custom theme extensions
    },
  },
  plugins: [],
}
```

## 📖 Usage

### For Students
1. **Sign Up**: Create an account with student role
2. **Verify Email**: Check email and click verification link
3. **Sign In**: Login with credentials
4. **View Progress**: See personal academic progress
5. **Classroom Info**: Access classroom and teacher details
6. **Update Profile**: Manage personal information

### For Teachers
1. **Sign Up**: Create an account with teacher role
2. **Verify Email**: Check email and click verification link
3. **Sign In**: Login with credentials
4. **Dashboard**: View overview of all students
5. **Manage Classrooms**: Create and manage classrooms
6. **Manage Progress**: Add and edit student progress records
7. **Analytics**: View completion rates and statistics

### Navigation
- **Student Navigation**: My Progress, Classroom Info, Profile
- **Teacher Navigation**: Teacher Dashboard, Manage Classrooms, Manage Progress, Profile
- **Responsive Design**: Mobile-friendly navigation menu

## 🔌 API Reference

### Authentication Endpoints
```typescript
// Sign up
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password',
  options: {
    data: {
      name: 'User Name',
      role: 'student' // or 'teacher'
    }
  }
});

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
});

// Sign out
const { error } = await supabase.auth.signOut();
```

### Database Operations
```typescript
// Get user profile
const { data, error } = await supabase
  .from('users')
  .select('*')
  .eq('id', userId)
  .single();

// Get student progress
const { data, error } = await supabase
  .from('progress')
  .select(`
    *,
    classroom:classroom_id(name, room_number)
  `)
  .eq('user_id', userId);

// Create classroom (teachers only)
const { data, error } = await supabase
  .from('classroom')
  .insert({
    name: 'Math 101',
    schedule: 'Mon/Wed/Fri 9:00-10:00',
    room_number: 'Room 205',
    teacher_id: teacherId
  });
```

### Real-time Subscriptions
```typescript
// Subscribe to progress changes
const channel = supabase
  .channel('progress-updates')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'progress'
  }, (payload) => {
    console.log('Progress updated:', payload);
  })
  .subscribe();
```

## 🧪 Testing

### Running Tests
```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test tests/rls.student.test.ts
```

### Test Structure
- **Unit Tests**: Component and hook testing
- **Integration Tests**: RLS policy testing
- **E2E Tests**: Full user flow testing

### Test Files
- `tests/rls.student.test.ts` - Student RLS policy tests
- `tests/rls.teacher.test.ts` - Teacher RLS policy tests
- `tests/helpers/supabaseTestClients.ts` - Test client setup

## 🚀 Deployment

### Vercel Deployment
1. **Build the Project**:
   ```bash
   npm run build
   ```

2. **Deploy to Vercel**:
   ```bash
   npx vercel --prod
   ```

3. **Environment Variables**: Set up environment variables in Vercel dashboard

### Netlify Deployment
1. **Build Command**: `npm run build`
2. **Publish Directory**: `dist`
3. **Environment Variables**: Configure in Netlify dashboard

### Docker Deployment
```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "run", "preview"]
```

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests: `npm test`
5. Commit changes: `git commit -m 'Add amazing feature'`
6. Push to branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Code Style
- Follow TypeScript best practices
- Use ESLint configuration provided
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Supabase** - For the amazing backend platform
- **React Team** - For the excellent frontend framework
- **TailwindCSS** - For the utility-first CSS framework
- **Vite** - For the fast build tool

## 📞 Support

If you have any questions or need help:

1. **Check the Issues**: Look through existing issues
2. **Create an Issue**: Describe your problem or feature request
3. **Contact**: Reach out to the maintainers

## 🔮 Roadmap

### Planned Features
- [ ] **Mobile App**: React Native version
- [ ] **Advanced Analytics**: More detailed progress analytics
- [ ] **Notifications**: Email and push notifications
- [ ] **File Uploads**: Assignment and document management
- [ ] **Calendar Integration**: Schedule management
- [ ] **Multi-language Support**: Internationalization
- [ ] **Dark/Light Theme**: Theme switching
- [ ] **Offline Support**: PWA capabilities

### Performance Improvements
- [ ] **Code Splitting**: Lazy loading of components
- [ ] **Caching**: Improved data caching strategies
- [ ] **Optimization**: Bundle size optimization
- [ ] **CDN**: Content delivery network integration

---

**Built with ❤️ using React, TypeScript, and Supabase**

*RLS Guard Dog - Secure classroom progress tracking made simple*