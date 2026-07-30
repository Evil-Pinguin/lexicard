import { useEffect, useRef } from 'react';
import { type Mode, type WordCard, type Direction } from '../types';

type AnswerStatus = 'idle' | 'correct' | 'incorrect';

interface FlashcardProps {
  mode: Mode;
  currentWord: WordCard;
  timeLeft: number;
  userAnswer: string;
  answerStatus: AnswerStatus;
  choices: string[];
  progressPercent: number;
  direction: Direction; // <-- Добавили направление
  setUserAnswer: (answer: string) => void;
  handleCheckAnswer: () => void;
  handleCheckChoice: (choice: string) => void;
  handleNextWord: () => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  isRetryPhase: boolean;
}

export const Flashcard = ({
  mode, currentWord, timeLeft, userAnswer, answerStatus, choices, progressPercent, direction, isRetryPhase,
  setUserAnswer, handleCheckAnswer, handleCheckChoice, handleNextWord, handleKeyDown
}: FlashcardProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (mode === 'input' && answerStatus === 'idle') {
      inputRef.current?.focus();
    }
  }, [currentWord, mode, answerStatus]);

  // Определяем, какое слово показывать крупно, а какое прятать
  const displayWord = direction === 'en-ru' ? currentWord.english : currentWord.russian;
  const correctAnswerText = direction === 'en-ru' ? currentWord.russian : currentWord.english;
  const placeholderText = direction === 'en-ru' ? 'Введите перевод на русский' : 'Введите перевод на английский';
  const speakWord = () => {
    // Создаем команду для синтеза речи
    const utterance = new SpeechSynthesisUtterance(currentWord.english);
    utterance.lang = 'en-US'; // Говорим браузеру, что язык английский
    utterance.rate = 0.9; // Чуть медленнее, чтобы было понятно ученикам
    window.speechSynthesis.speak(utterance);
  };
  return (
    <div className="app">
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${progressPercent}%` }}></div>
      </div>
            {isRetryPhase && (
        <div className="retry-banner">🔁 Повторение ошибок</div>
      )}
      
      <div className="card card-animate" key={currentWord.id}>
                <div className="word-with-audio">
          <h2 className="word">{displayWord}</h2>
          {direction === 'en-ru' && (
            <button className="audio-btn" onClick={speakWord} title="Произнести">
              🔊
            </button>
          )}
        </div>
        <p className={`timer ${timeLeft <= 3 ? 'timer-danger' : ''}`}>Осталось времени: {timeLeft} сек</p>
        
        {answerStatus === 'correct' && (
          <div className="dopamine-badge">Отлично! +1</div>
        )}

        {answerStatus === 'incorrect' && (
          <div className="correction-block">
            <p className="correct-answer">Правильный ответ: {correctAnswerText}</p>
            {mode === 'input' && userAnswer.trim() && (
              <p className="wrong-answer">Ваш ответ: {userAnswer}</p>
            )}
          </div>
        )}
        
        {mode === 'input' ? (
          <div className="input-mode">
            <input 
              ref={inputRef}
              type="text" 
              className={`answer-input ${answerStatus}`}
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholderText}
              disabled={answerStatus !== 'idle'}
            />
            <button className="btn btn-primary" onClick={handleCheckAnswer}>Проверить</button>
          </div>
        ) : (
          <div className="choices-mode">
            {choices.map((choice) => (
              <button 
                key={choice} 
                className={`choice-btn ${
                  answerStatus === 'idle' ? '' : choice === correctAnswerText ? 'correct' : 'incorrect'
                }`}
                onClick={() => handleCheckChoice(choice)}
                disabled={answerStatus !== 'idle'}
              >
                {choice}
              </button>
            ))}
          </div>
        )}
        
        <button className="btn btn-secondary" onClick={handleNextWord}>Следующее слово →</button>
      </div>
    </div>
  );
};