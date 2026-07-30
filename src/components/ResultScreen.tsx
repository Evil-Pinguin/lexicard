import { useEffect } from 'react';
import confetti from 'canvas-confetti';

interface ResultScreenProps {
  score: number;
  totalWords: number;
  hadRetries: boolean; // Новый пропс: были ли ошибки в первом круге
}

export const ResultScreen = ({ score, totalWords, hadRetries }: ResultScreenProps) => {
  useEffect(() => {
    // Конфетти только если не было ошибок в первом круге И ответили на всё верно в итоге
    const isPerfect = score === totalWords && !hadRetries;
    
    if (isPerfect) {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 }
      });
      
      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0 }
        });
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1 }
        });
      }, 250);
    }
  }, [score, totalWords, hadRetries]);

  const isPerfectScore = score === totalWords && !hadRetries;

  return (
    <div className="app">
      <div className="result-screen">
        <h1>Тест завершен!</h1>
        <p className="score-text">
          {isPerfectScore 
            ? 'Идеально! Все ответы верны с первого раза! 🏆' 
            : `Ваш результат: ${score} из ${totalWords}`}
        </p>
        {hadRetries && (
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '24px' }}>
            Вы исправили свои ошибки в этапе повторения. Так держать! 💪
          </p>
        )}
        <button className="btn btn-primary" onClick={() => window.location.reload()}>Начать заново</button>
      </div>
    </div>
  );
};