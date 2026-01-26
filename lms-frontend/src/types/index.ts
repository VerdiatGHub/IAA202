// User types
export type UserRole = 'student' | 'instructor' | 'admin';

export interface User {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  role: UserRole;
  createdAt: string;
}

// Course types
export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnailUrl?: string;
  instructorId: string;
  instructor?: User;
  isPublished: boolean;
  isPublic?: boolean;
  createdAt: string;
  enrollmentCount?: number;
  lessonCount?: number;
  duration?: string;
  category?: string;
  level?: 'beginner' | 'intermediate' | 'advanced';
}

// Module types
export interface Module {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  orderIndex: number;
  lessonCount?: number;
  lessons?: Lesson[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateModuleDto {
  title: string;
  description?: string;
}

export interface UpdateModuleDto {
  title?: string;
  description?: string;
  orderIndex?: number;
}

// Lesson types
export interface Lesson {
  id: string;
  courseId: string;
  moduleId?: string;
  title: string;
  content?: string;
  videoUrl?: string;
  orderIndex: number;
  duration?: number; // in minutes
  isRequired?: boolean;
  contentItems?: ContentItem[];
  createdAt: string;
  isCompleted?: boolean;
}

export interface CreateLessonDto {
  title: string;
  content?: string;
  videoUrl?: string;
  duration?: number;
  isRequired?: boolean;
}

export interface UpdateLessonDto {
  title?: string;
  content?: string;
  videoUrl?: string;
  duration?: number;
  isRequired?: boolean;
  orderIndex?: number;
}

// Content Item types
export type ContentType = 'video' | 'text' | 'quiz' | 'assignment' | 'resource';

export interface ContentItem {
  id: string;
  lessonId: string;
  contentType: ContentType;
  title: string;
  description?: string;
  orderIndex: number;
  isRequired: boolean;
  
  // Type-specific fields
  videoUrl?: string;
  duration?: number;
  textContent?: string;
  quizId?: string;
  assignmentId?: string;
  resourceType?: 'file' | 'link';
  resourceUrl?: string;
  filePath?: string;
  
  createdAt: string;
  updatedAt: string;
}

export interface CreateContentItemDto {
  contentType: ContentType;
  title: string;
  description?: string;
  isRequired?: boolean;
  
  // Video fields
  videoUrl?: string;
  duration?: number;
  
  // Text fields
  textContent?: string;
  
  // Quiz fields - inline creation
  quizData?: {
    title: string;
    timeLimit?: number;
    questions: Array<{
      questionText: string;
      options: string[];
      correctAnswer: number;
      points: number;
    }>;
  };
  
  // Assignment fields - inline creation
  assignmentData?: {
    description: string;
    dueDate?: string;
    maxPoints?: number;
  };
  
  // Resource fields
  resourceType?: 'file' | 'link';
  resourceUrl?: string;
  filePath?: string;
}

export interface UpdateContentItemDto {
  title?: string;
  description?: string;
  isRequired?: boolean;
  orderIndex?: number;
  
  // Video fields
  videoUrl?: string;
  duration?: number;
  
  // Text fields
  textContent?: string;
  
  // Quiz fields
  quizId?: string;
  
  // Assignment fields
  assignmentId?: string;
  
  // Resource fields
  resourceType?: 'file' | 'link';
  resourceUrl?: string;
  filePath?: string;
}

// Enrollment types
export interface Enrollment {
  id: string;
  studentId: string;
  courseId: string;
  course?: Course;
  progress: number; // 0-100
  enrolledAt: string;
  completedAt?: string;
}

// Assignment types
export interface Assignment {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  dueDate?: string;
  maxScore: number;
  createdAt: string;
}

// Submission types
export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  student?: User;
  fileUrl?: string;
  content?: string;
  score?: number;
  feedback?: string;
  submittedAt: string;
  gradedAt?: string;
}

// Quiz types
export interface Quiz {
  id: string;
  courseId: string;
  title: string;
  timeLimit?: number; // in minutes
  questions?: Question[];
  createdAt: string;
}

export interface Question {
  id: string;
  quizId: string;
  questionText: string;
  questionType: 'multiple_choice' | 'true_false' | 'short_answer';
  options?: string[];
  correctAnswer: string;
  points: number;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  studentId: string;
  answers: Record<string, string>;
  score?: number;
  startedAt: string;
  completedAt?: string;
}

// Notification types
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  createdAt: string;
}

// AI Chat types
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  courseContext?: string;
}

// Dashboard stats
export interface StudentStats {
  enrolledCourses: number;
  completedCourses: number;
  averageProgress: number;
  upcomingDeadlines: number;
  totalStudyHours: number;
}

export interface InstructorStats {
  totalCourses: number;
  totalStudents: number;
  pendingSubmissions: number;
  averageRating: number;
}

export interface AdminStats {
  totalUsers: number;
  totalCourses: number;
  activeUsers: number;
  newUsersThisMonth: number;
}

// API Response types
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

// Form types
export interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  role: UserRole;
  agreeToTerms: boolean;
}

export interface CourseFormData {
  title: string;
  description: string;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  thumbnail?: File;
}
