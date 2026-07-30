import { useEffect } from 'react';
import confetti from 'canvas-confetti';

interface ResultScreenProps {
  score: number;
  totalWords: number;
}

export const ResultScreen = ({ score, totalWords }: ResultScreenProps) => {
  useEffect(() => {

    if (score === totalWords) {

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
  }, [score, totalWords]);

  return (
    <div className="app">
      <div className="result-screen">
        <h1>Тест завершен!</h1>
        <p className="score-text">
          {score === totalWords ? 'Идеально! Все ответы верны! 🏆' : `Ваш результат: ${score} из ${totalWords}`}
        </p>
        <button className="btn btn-primary" onClick={() => window.location.reload()}>Начать заново</button>
      </div>
    </div>
  );
};