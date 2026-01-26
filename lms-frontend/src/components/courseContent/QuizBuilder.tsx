import { X, Plus, Trash2 } from 'lucide-react';
import './QuizBuilder.css';

interface QuizQuestion {
  id: string;
  questionText: string;
  options: string[];
  correctAnswer: number;
  points: number;
}

interface QuizBuilderProps {
  questions: QuizQuestion[];
  onChange: (questions: QuizQuestion[]) => void;
}

export function QuizBuilder({ questions, onChange }: QuizBuilderProps) {
  const addQuestion = () => {
    const newQuestion: QuizQuestion = {
      id: `temp-${Date.now()}`,
      questionText: '',
      options: ['', ''],
      correctAnswer: 0,
      points: 1
    };
    onChange([...questions, newQuestion]);
  };

  const removeQuestion = (index: number) => {
    onChange(questions.filter((_, i) => i !== index));
  };

  const updateQuestion = (index: number, field: keyof QuizQuestion, value: any) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const addOption = (questionIndex: number) => {
    const updated = [...questions];
    updated[questionIndex].options.push('');
    onChange(updated);
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const updated = [...questions];
    if (updated[questionIndex].options.length > 2) {
      updated[questionIndex].options.splice(optionIndex, 1);
      // Adjust correct answer if needed
      if (updated[questionIndex].correctAnswer >= optionIndex) {
        updated[questionIndex].correctAnswer = Math.max(0, updated[questionIndex].correctAnswer - 1);
      }
      onChange(updated);
    }
  };

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const updated = [...questions];
    updated[questionIndex].options[optionIndex] = value;
    onChange(updated);
  };

  return (
    <div className="quiz-builder">
      <div className="quiz-builder-header">
        <h3>Quiz Questions</h3>
        <button type="button" className="btn-add-question" onClick={addQuestion}>
          <Plus size={16} />
          Add Question
        </button>
      </div>

      {questions.length === 0 && (
        <div className="quiz-empty-state">
          <p>No questions yet. Click "Add Question" to get started.</p>
        </div>
      )}

      {questions.map((question, qIndex) => (
        <div key={question.id} className="quiz-question-card">
          <div className="question-header">
            <span className="question-number">Question {qIndex + 1}</span>
            <button
              type="button"
              className="btn-remove-question"
              onClick={() => removeQuestion(qIndex)}
              title="Remove question"
            >
              <Trash2 size={16} />
            </button>
          </div>

          <div className="form-group">
            <label>Question Text *</label>
            <textarea
              value={question.questionText}
              onChange={(e) => updateQuestion(qIndex, 'questionText', e.target.value)}
              placeholder="Enter your question..."
              rows={3}
              required
            />
          </div>

          <div className="form-group">
            <label>Points</label>
            <input
              type="number"
              min="1"
              value={question.points}
              onChange={(e) => updateQuestion(qIndex, 'points', parseInt(e.target.value) || 1)}
              className="points-input"
            />
          </div>

          <div className="form-group">
            <label>Answer Options *</label>
            <div className="options-list">
              {question.options.map((option, oIndex) => (
                <div key={oIndex} className="option-row">
                  <input
                    type="radio"
                    name={`correct-${qIndex}`}
                    checked={question.correctAnswer === oIndex}
                    onChange={() => updateQuestion(qIndex, 'correctAnswer', oIndex)}
                    title="Mark as correct answer"
                  />
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                    placeholder={`Option ${oIndex + 1}`}
                    required
                  />
                  {question.options.length > 2 && (
                    <button
                      type="button"
                      className="btn-remove-option"
                      onClick={() => removeOption(qIndex, oIndex)}
                      title="Remove option"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              className="btn-add-option"
              onClick={() => addOption(qIndex)}
            >
              <Plus size={14} />
              Add Option
            </button>
            <p className="help-text">Select the radio button to mark the correct answer</p>
          </div>
        </div>
      ))}
    </div>
  );
}
