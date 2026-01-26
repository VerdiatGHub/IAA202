import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
    ArrowLeft,
    Users,
    FileText,
    Clock,
    CheckCircle,
    AlertCircle,
    Download,
    MessageSquare,
} from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import './InstructorCourseView.css';

// Mock data for course and submissions
const mockCourse = {
    id: '1',
    title: 'Web Development Fundamentals',
    category: 'Web Development',
    level: 'Beginner',
    students: 1542,
};

const mockAssignments = [
    {
        id: 'a1',
        title: 'Build a Simple Calculator',
        dueDate: '2026-02-15',
        maxPoints: 100,
        totalSubmissions: 45,
        graded: 30,
        pending: 15,
    },
    {
        id: 'a2',
        title: 'Create a Responsive Landing Page',
        dueDate: '2026-02-20',
        maxPoints: 150,
        totalSubmissions: 38,
        graded: 25,
        pending: 13,
    },
    {
        id: 'a3',
        title: 'JavaScript Functions Exercise',
        dueDate: '2026-02-25',
        maxPoints: 80,
        totalSubmissions: 42,
        graded: 42,
        pending: 0,
    },
];

const mockSubmissions = [
    {
        id: 's1',
        assignmentId: 'a1',
        studentName: 'John Doe',
        studentEmail: 'john.doe@example.com',
        submittedAt: '2026-02-14 10:30 AM',
        status: 'pending',
        fileUrl: '/submissions/john-calculator.zip',
        grade: null,
        feedback: null,
    },
    {
        id: 's2',
        assignmentId: 'a1',
        studentName: 'Jane Smith',
        studentEmail: 'jane.smith@example.com',
        submittedAt: '2026-02-13 2:15 PM',
        status: 'graded',
        fileUrl: '/submissions/jane-calculator.zip',
        grade: 95,
        feedback: 'Excellent work! Clean code and good implementation.',
    },
    {
        id: 's3',
        assignmentId: 'a1',
        studentName: 'Mike Johnson',
        studentEmail: 'mike.j@example.com',
        submittedAt: '2026-02-15 11:45 AM',
        status: 'pending',
        fileUrl: '/submissions/mike-calculator.zip',
        grade: null,
        feedback: null,
    },
    {
        id: 's4',
        assignmentId: 'a2',
        studentName: 'Sarah Williams',
        studentEmail: 'sarah.w@example.com',
        submittedAt: '2026-02-19 3:20 PM',
        status: 'graded',
        fileUrl: '/submissions/sarah-landing.zip',
        grade: 140,
        feedback: 'Great responsive design! Minor improvements needed in mobile view.',
    },
];

export const InstructorCourseView: React.FC = () => {
    const { courseId } = useParams<{ courseId: string }>();
    // courseId will be used for API calls in the future
    const [selectedAssignment, setSelectedAssignment] = useState<string | null>(null);
    const [gradingSubmission, setGradingSubmission] = useState<string | null>(null);
    const [gradeValue, setGradeValue] = useState<string>('');
    const [feedbackValue, setFeedbackValue] = useState<string>('');

    const filteredSubmissions = selectedAssignment
        ? mockSubmissions.filter((s) => s.assignmentId === selectedAssignment)
        : [];

    const selectedAssignmentData = mockAssignments.find((a) => a.id === selectedAssignment);

    const handleGradeSubmit = (submissionId: string) => {
        console.log('Grading submission:', submissionId, gradeValue, feedbackValue);
        // TODO: API call to submit grade
        setGradingSubmission(null);
        setGradeValue('');
        setFeedbackValue('');
    };

    return (
        <div className="instructor-course-view">
            {/* Header */}
            <div className="course-view-header">
                <Link to="/instructor/courses" className="back-link">
                    <ArrowLeft size={20} />
                    Back to My Courses
                </Link>
                <div className="course-info">
                    <h1 className="course-title">{mockCourse.title}</h1>
                    <div className="course-meta">
                        <span>{mockCourse.category}</span>
                        <span>•</span>
                        <span>{mockCourse.level}</span>
                        <span>•</span>
                        <span>
                            <Users size={14} />
                            {mockCourse.students} students
                        </span>
                    </div>
                </div>
            </div>

            {/* Assignments List */}
            <div className="assignments-section">
                <h2 className="section-title">Assignments</h2>
                <div className="assignments-grid">
                    {mockAssignments.map((assignment) => (
                        <Card
                            key={assignment.id}
                            className={`assignment-card ${selectedAssignment === assignment.id ? 'selected' : ''}`}
                            onClick={() => setSelectedAssignment(assignment.id)}
                        >
                            <div className="assignment-header">
                                <FileText size={20} />
                                <h3>{assignment.title}</h3>
                            </div>
                            <div className="assignment-stats">
                                <div className="stat">
                                    <span className="stat-label">Due Date</span>
                                    <span className="stat-value">
                                        <Clock size={14} />
                                        {new Date(assignment.dueDate).toLocaleDateString()}
                                    </span>
                                </div>
                                <div className="stat">
                                    <span className="stat-label">Max Points</span>
                                    <span className="stat-value">{assignment.maxPoints}</span>
                                </div>
                            </div>
                            <div className="submission-stats">
                                <div className="stat-item graded">
                                    <CheckCircle size={16} />
                                    <span>{assignment.graded} Graded</span>
                                </div>
                                <div className="stat-item pending">
                                    <AlertCircle size={16} />
                                    <span>{assignment.pending} Pending</span>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Submissions List */}
            {selectedAssignment && (
                <div className="submissions-section">
                    <div className="submissions-header">
                        <h2 className="section-title">
                            Submissions for "{selectedAssignmentData?.title}"
                        </h2>
                        <span className="submission-count">
                            {filteredSubmissions.length} submission(s)
                        </span>
                    </div>

                    {filteredSubmissions.length === 0 ? (
                        <Card className="empty-state">
                            <FileText size={48} />
                            <p>No submissions yet</p>
                        </Card>
                    ) : (
                        <div className="submissions-list">
                            {filteredSubmissions.map((submission) => (
                                <Card key={submission.id} className="submission-card">
                                    <div className="submission-info">
                                        <div className="student-info">
                                            <div className="student-avatar">
                                                {submission.studentName.charAt(0)}
                                            </div>
                                            <div className="student-details">
                                                <h4>{submission.studentName}</h4>
                                                <p>{submission.studentEmail}</p>
                                            </div>
                                        </div>
                                        <div className="submission-meta">
                                            <span className="submitted-time">
                                                <Clock size={14} />
                                                Submitted: {submission.submittedAt}
                                            </span>
                                            <span className={`status-badge ${submission.status}`}>
                                                {submission.status === 'graded' ? (
                                                    <>
                                                        <CheckCircle size={14} />
                                                        Graded
                                                    </>
                                                ) : (
                                                    <>
                                                        <AlertCircle size={14} />
                                                        Pending
                                                    </>
                                                )}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="submission-actions">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            icon={<Download size={16} />}
                                        >
                                            Download
                                        </Button>
                                        {submission.status === 'pending' ? (
                                            <Button
                                                variant="primary"
                                                size="sm"
                                                onClick={() => setGradingSubmission(submission.id)}
                                            >
                                                Grade
                                            </Button>
                                        ) : (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setGradingSubmission(submission.id)}
                                            >
                                                View Grade
                                            </Button>
                                        )}
                                    </div>

                                    {/* Grading Form */}
                                    {gradingSubmission === submission.id && (
                                        <div className="grading-form">
                                            <div className="form-group">
                                                <label>Grade (out of {selectedAssignmentData?.maxPoints})</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max={selectedAssignmentData?.maxPoints}
                                                    value={gradeValue || submission.grade || ''}
                                                    onChange={(e) => setGradeValue(e.target.value)}
                                                    placeholder="Enter grade"
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>Feedback</label>
                                                <textarea
                                                    value={feedbackValue || submission.feedback || ''}
                                                    onChange={(e) => setFeedbackValue(e.target.value)}
                                                    placeholder="Provide feedback to the student..."
                                                    rows={4}
                                                />
                                            </div>
                                            <div className="form-actions">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => {
                                                        setGradingSubmission(null);
                                                        setGradeValue('');
                                                        setFeedbackValue('');
                                                    }}
                                                >
                                                    Cancel
                                                </Button>
                                                <Button
                                                    variant="primary"
                                                    size="sm"
                                                    onClick={() => handleGradeSubmit(submission.id)}
                                                >
                                                    Submit Grade
                                                </Button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Display existing grade */}
                                    {submission.status === 'graded' && gradingSubmission !== submission.id && (
                                        <div className="grade-display">
                                            <div className="grade-info">
                                                <span className="grade-label">Grade:</span>
                                                <span className="grade-value">
                                                    {submission.grade}/{selectedAssignmentData?.maxPoints}
                                                </span>
                                            </div>
                                            {submission.feedback && (
                                                <div className="feedback-display">
                                                    <MessageSquare size={16} />
                                                    <p>{submission.feedback}</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {!selectedAssignment && (
                <div className="no-selection">
                    <FileText size={64} />
                    <h3>Select an assignment</h3>
                    <p>Choose an assignment above to view student submissions</p>
                </div>
            )}
        </div>
    );
};

export default InstructorCourseView;
