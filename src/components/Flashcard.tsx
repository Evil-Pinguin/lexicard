import { useEffect, useRef } from 'react';
import { type Mode, type WordCard } from '../types';

type AnswerStatus = 'idle' | 'correct' | 'incorrect';

interface FlashcardProps {
  mode: Mode;
  currentWord: WordCard;
  timeLeft: number;
  userAnswer: string;
  answerStatus: AnswerStatus;
  choices: string[];
  progressPercent: number;
  setUserAnswer: (answer: string) => void;
  handleCheckAnswer: () => void;
  handleCheckChoice: (choice: string) => void;
  handleNextWord: () => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export const Flashcard = ({
  mode, currentWord, timeLeft, userAnswer, answerStatus, choices, progressPercent,
  setUserAnswer, handleCheckAnswer, handleCheckChoice, handleNextWord, handleKeyDown
}: FlashcardProps) => {
  // Хук для связи с DOM-элементом инпута
  const inputRef = useRef<HTMLInputElement>(null);

  // Автофокус на инпуте при смене слова или режима
  useEffect(() => {
    if (mode === 'input' && answerStatus === 'idle') {
      inputRef.current?.focus();
    }
  }, [currentWord, mode, answerStatus]);

  return (
    <div className="app">
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${progressPercent}%` }}></div>
      </div>
      
        <div className="card card-animate" key={currentWord.id}>
        <h2 className="word">{currentWord.english}</h2>
        <p className={`timer ${timeLeft <= 3 ? 'timer-danger' : ''}`}>Осталось времени: {timeLeft} сек</p>
        {answerStatus === 'correct' && (
          <div className="dopamine-badge">Отлично! +1</div>
        )}
        
        {mode === 'input' ? (
          <div className="input-mode">
            <input 
              ref={inputRef} // Привязываем ссылку к инпуту
              type="text" 
              className={`answer-input ${answerStatus}`}
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Введите перевод"
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
                  answerStatus === 'idle' ? '' : choice === currentWord.russian ? 'correct' : 'incorrect'
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