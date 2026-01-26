import React, { useState, useEffect } from 'react';
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
import Loading from '../../components/common/Loading';
import { courseService } from '../../services/courseService';
import { assignmentService, type Assignment } from '../../services/assignmentService';
import { submissionService, type Submission } from '../../services/submissionService';
import toast from 'react-hot-toast';
import './InstructorCourseView.css';

interface Course {
    id: string;
    title: string;
    category?: string;
    level?: string;
    enrollmentCount?: number;
}

export const InstructorCourseView: React.FC = () => {
    const { courseId } = useParams<{ courseId: string }>();
    const [course, setCourse] = useState<Course | null>(null);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [selectedAssignment, setSelectedAssignment] = useState<string | null>(null);
    const [gradingSubmission, setGradingSubmission] = useState<string | null>(null);
    const [gradeValue, setGradeValue] = useState<string>('');
    const [feedbackValue, setFeedbackValue] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (courseId) {
            loadCourseData();
        }
    }, [courseId]);

    useEffect(() => {
        if (selectedAssignment) {
            loadSubmissions();
        }
    }, [selectedAssignment]);

    const loadCourseData = async () => {
        try {
            setLoading(true);
            console.log('Loading course data for courseId:', courseId);
            const [courseData, assignmentsData] = await Promise.all([
                courseService.getCourseById(courseId!),
                assignmentService.getAssignmentsByCourse(courseId!)
            ]);
            console.log('Course data loaded:', courseData);
            console.log('Assignments data loaded:', assignmentsData);
            setCourse(courseData);
            setAssignments(assignmentsData);
        } catch (error: any) {
            console.error('Error loading course data:', error);
            console.error('Error message:', error.message);
            console.error('Error response:', error.response);
            toast.error(error.message || 'Failed to load course data');
        } finally {
            setLoading(false);
        }
    };

    const loadSubmissions = async () => {
        try {
            const submissionsData = await submissionService.getSubmissionsByAssignment(selectedAssignment!);
            setSubmissions(submissionsData);
        } catch (error) {
            console.error('Error loading submissions:', error);
            toast.error('Failed to load submissions');
        }
    };

    const handleGradeSubmit = async (submissionId: string) => {
        if (!gradeValue) {
            toast.error('Please enter a grade');
            return;
        }

        const selectedAssignmentData = assignments.find((a) => a.id === selectedAssignment);
        const grade = parseInt(gradeValue);

        if (isNaN(grade) || grade < 0 || grade > (selectedAssignmentData?.maxScore || 100)) {
            toast.error(`Grade must be between 0 and ${selectedAssignmentData?.maxScore || 100}`);
            return;
        }

        try {
            setSubmitting(true);
            await submissionService.gradeSubmission(submissionId, {
                score: grade,
                feedback: feedbackValue || undefined
            });
            
            toast.success('Grade submitted successfully');
            setGradingSubmission(null);
            setGradeValue('');
            setFeedbackValue('');
            
            // Reload submissions and assignments to update counts
            await Promise.all([loadSubmissions(), loadCourseData()]);
        } catch (error) {
            console.error('Error grading submission:', error);
            toast.error('Failed to submit grade');
        } finally {
            setSubmitting(false);
        }
    };

    const filteredSubmissions = submissions;
    const selectedAssignmentData = assignments.find((a) => a.id === selectedAssignment);

    if (loading) {
        return <Loading />;
    }

    if (!course) {
        return (
            <div className="instructor-course-view">
                <div className="empty-state">
                    <FileText size={48} />
                    <h3>Course not found</h3>
                    <Link to="/instructor/courses">
                        <Button variant="primary">Back to My Courses</Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="instructor-course-view">
            {/* Header */}
            <div className="course-view-header">
                <Link to="/instructor/courses" className="back-link">
                    <ArrowLeft size={20} />
                    Back to My Courses
                </Link>
                <div className="course-info">
                    <h1 className="course-title">{course.title}</h1>
                    <div className="course-meta">
                        <span>{course.category}</span>
                        <span>•</span>
                        <span>{course.level}</span>
                        <span>•</span>
                        <span>
                            <Users size={14} />
                            {course.enrollmentCount || 0} students
                        </span>
                    </div>
                </div>
            </div>

            {/* Assignments List */}
            <div className="assignments-section">
                <h2 className="section-title">Assignments</h2>
                {assignments.length === 0 ? (
                    <Card className="empty-state">
                        <FileText size={48} />
                        <p>No assignments yet</p>
                    </Card>
                ) : (
                    <div className="assignments-grid">
                        {assignments.map((assignment) => (
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
                                    <span className="stat-value">{assignment.maxScore}</span>
                                </div>
                            </div>
                            <div className="submission-stats">
                                <div className="stat-item graded">
                                    <CheckCircle size={16} />
                                    <span>{assignment.gradedCount} Graded</span>
                                </div>
                                <div className="stat-item pending">
                                    <AlertCircle size={16} />
                                    <span>{assignment.pendingCount} Pending</span>
                                </div>
                            </div>
                        </Card>
                        ))}
                    </div>
                )}
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
                                                {submission.student.fullName.charAt(0)}
                                            </div>
                                            <div className="student-details">
                                                <h4>{submission.student.fullName}</h4>
                                                <p>{submission.student.email}</p>
                                            </div>
                                        </div>
                                        <div className="submission-meta">
                                            <span className="submitted-time">
                                                <Clock size={14} />
                                                Submitted: {new Date(submission.submittedAt).toLocaleString()}
                                            </span>
                                            <span className={`status-badge ${submission.score !== null && submission.score !== undefined ? 'graded' : 'pending'}`}>
                                                {submission.score !== null && submission.score !== undefined ? (
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
                                        {submission.fileUrl && (
                                            <a href={submission.fileUrl} target="_blank" rel="noopener noreferrer">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    icon={<Download size={16} />}
                                                >
                                                    Download
                                                </Button>
                                            </a>
                                        )}
                                        {submission.score === null || submission.score === undefined ? (
                                            <Button
                                                variant="primary"
                                                size="sm"
                                                onClick={() => {
                                                    setGradingSubmission(submission.id);
                                                    setGradeValue('');
                                                    setFeedbackValue('');
                                                }}
                                            >
                                                Grade
                                            </Button>
                                        ) : (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    setGradingSubmission(submission.id);
                                                    setGradeValue(submission.score?.toString() || '');
                                                    setFeedbackValue(submission.feedback || '');
                                                }}
                                            >
                                                Edit Grade
                                            </Button>
                                        )}
                                    </div>

                                    {/* Grading Form */}
                                    {gradingSubmission === submission.id && (
                                        <div className="grading-form">
                                            <div className="form-group">
                                                <label>Grade (out of {selectedAssignmentData?.maxScore})</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max={selectedAssignmentData?.maxScore}
                                                    value={gradeValue || submission.score || ''}
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
                                                    disabled={submitting}
                                                >
                                                    Cancel
                                                </Button>
                                                <Button
                                                    variant="primary"
                                                    size="sm"
                                                    onClick={() => handleGradeSubmit(submission.id)}
                                                    disabled={submitting}
                                                >
                                                    {submitting ? 'Submitting...' : 'Submit Grade'}
                                                </Button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Display existing grade */}
                                    {(submission.score !== null && submission.score !== undefined) && gradingSubmission !== submission.id && (
                                        <div className="grade-display">
                                            <div className="grade-info">
                                                <span className="grade-label">Grade:</span>
                                                <span className="grade-value">
                                                    {submission.score}/{selectedAssignmentData?.maxScore}
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
