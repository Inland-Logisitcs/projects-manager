import { useState, useMemo } from 'react';
import Icon from '../common/Icon';

const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const TestRunner = ({ test, onComplete, onSaveAttempt, previousScore }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [shuffleKey, setShuffleKey] = useState(0);

  const questions = test?.questions || [];

  const shuffledOptions = useMemo(() => {
    return questions.map(q => shuffleArray(q.options));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questions, shuffleKey]);
  const question = questions[currentQuestion];

  const handleSelectOption = (optionId) => {
    if (showResults) return;
    setAnswers(prev => ({ ...prev, [currentQuestion]: optionId }));
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const handleSubmit = () => {
    let correct = 0;
    questions.forEach((q, idx) => {
      if (answers[idx] === q.correctOptionId) {
        correct++;
      }
    });
    setScore(correct);
    setShowResults(true);
    // Save every attempt (passed or not)
    if (onSaveAttempt) onSaveAttempt(correct, questions.length);
  };

  const handleRetry = () => {
    setAnswers({});
    setCurrentQuestion(0);
    setShowResults(false);
    setScore(0);
    setShuffleKey(prev => prev + 1);
  };

  const allAnswered = Object.keys(answers).length === questions.length;
  const passed = score === questions.length;

  if (showResults) {
    return (
      <div className="test-results">
        <div className={`test-results-header ${passed ? 'test-passed' : 'test-failed'}`}>
          <div className="test-results-icon">
            <Icon name={passed ? 'check-circle' : 'x-circle'} size={48} />
          </div>
          <h3 className="heading-3">{passed ? 'Aprobado' : 'No aprobado'}</h3>
          <p className="text-base mt-sm">
            {score} de {questions.length} respuestas correctas
            ({Math.round((score / questions.length) * 100)}%)
          </p>
          {!passed && (
            <p className="text-sm text-secondary mt-xs">
              Necesitas 100% para aprobar. Revisa las respuestas y vuelve a intentarlo.
            </p>
          )}
        </div>

        <div className="test-review">
          {questions.map((q, idx) => {
            const userAnswer = answers[idx];
            const isCorrect = userAnswer === q.correctOptionId;
            return (
              <div key={idx} className={`test-review-item ${isCorrect ? 'correct' : 'incorrect'}`}>
                <div className="flex items-center gap-sm mb-xs">
                  <Icon name={isCorrect ? 'check' : 'x'} size={16} />
                  <span className="font-medium text-sm">Pregunta {idx + 1}</span>
                </div>
                <p className="text-sm mb-xs">{q.question}</p>
                {!isCorrect && (
                  <>
                    <p className="text-xs text-secondary">
                      Tu respuesta: {q.options.find(o => o.id === userAnswer)?.text}
                    </p>
                    {q.options.find(o => o.id === userAnswer)?.explanation && (
                      <p className="text-xs text-secondary mt-xs" style={{ fontStyle: 'italic' }}>
                        {q.options.find(o => o.id === userAnswer)?.explanation}
                      </p>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>

        <div className="test-actions flex gap-sm mt-base">
          {!passed && (
            <button className="btn btn-primary" onClick={handleRetry}>
              <Icon name="refresh-cw" size={16} />
              Reintentar
            </button>
          )}
          {passed && (
            <button className="btn btn-primary" onClick={() => onComplete(score, questions.length)}>
              <Icon name="arrow-right" size={16} />
              Continuar
            </button>
          )}

        </div>
      </div>
    );
  }

  return (
    <div className="test-runner">
      <div className="test-header flex items-center justify-between mb-base">
        <h3 className="heading-3">Test de la leccion</h3>
        <span className="badge badge-primary">
          {currentQuestion + 1} / {questions.length}
        </span>
      </div>

      {previousScore !== undefined && previousScore !== null && (
        <div className="test-previous-score text-sm text-secondary mb-base">
          Mejor puntaje anterior: {previousScore.bestScore}/{previousScore.totalQuestions}
          {previousScore.attempts > 0 && ` (${previousScore.attempts} intentos)`}
        </div>
      )}

      <div className="test-progress-bar mb-base">
        <div
          className="test-progress-fill"
          style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
        />
      </div>

      <div className="test-question">
        <p className="text-base font-medium mb-base">{question?.question}</p>
        <div className="test-options">
          {(shuffledOptions[currentQuestion] || []).map(option => (
            <button
              key={option.id}
              className={`test-option ${answers[currentQuestion] === option.id ? 'selected' : ''}`}
              onClick={() => handleSelectOption(option.id)}
            >
              <span className="test-option-indicator">
                {answers[currentQuestion] === option.id ? (
                  <Icon name="check-circle" size={18} />
                ) : (
                  <span className="test-option-circle" />
                )}
              </span>
              <span className="test-option-text">{option.text}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="test-nav flex items-center justify-between mt-base">
        <button
          className="btn btn-secondary btn-sm"
          onClick={handlePrevious}
          disabled={currentQuestion === 0}
        >
          <Icon name="chevron-left" size={16} />
          Anterior
        </button>

        <div className="test-dots flex gap-xs">
          {questions.map((_, idx) => (
            <button
              key={idx}
              className={`test-dot ${idx === currentQuestion ? 'active' : ''} ${answers[idx] !== undefined ? 'answered' : ''}`}
              onClick={() => setCurrentQuestion(idx)}
            />
          ))}
        </div>

        {currentQuestion < questions.length - 1 ? (
          <button
            className="btn btn-secondary btn-sm"
            onClick={handleNext}
            disabled={answers[currentQuestion] === undefined}
          >
            Siguiente
            <Icon name="chevron-right" size={16} />
          </button>
        ) : (
          <button
            className="btn btn-primary btn-sm"
            onClick={handleSubmit}
            disabled={!allAnswered}
          >
            Enviar
            <Icon name="send" size={16} />
          </button>
        )}
      </div>
    </div>
  );
};

export default TestRunner;
