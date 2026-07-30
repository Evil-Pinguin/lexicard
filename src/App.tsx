import { useState, useEffect } from 'react';
import { words as initialWords } from './data';
import { type Mode, type WordCard } from './types';
import { StartScreen } from './components/StartScreen';
import { ResultScreen } from './components/ResultScreen';
import { Flashcard } from './components/Flashcard';

type AnswerStatus = 'idle' | 'correct' | 'incorrect';

// Функция генерации звука (остается здесь, так как это утилита)
const playSound = (isCorrect: boolean) => {
  const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
  const audioContext = new AudioContext();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  if (isCorrect) {
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); 
    oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1); 
    oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2); 
  } else {
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(150, audioContext.currentTime);
  }
  gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.3);
};

function App() {
  // Основные стейты
  const [mode, setMode] = useState<Mode | null>(null); 
  const [choices, setChoices] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [answerStatus, setAnswerStatus] = useState<AnswerStatus>('idle');
  const [score, setScore] = useState<number>(0);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(10);

  // AI стейты (теперь на своем месте, на верху компонента)
  const [words, setWords] = useState<WordCard[]>(initialWords);
  const [topic, setTopic] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const currentWord = words[currentIndex];

  const generateChoices = (correctWord: WordCard) => {
    const wrongTranslations = words.filter(w => w.id !== correctWord.id).map(w => w.russian);
    const shuffledWrong = wrongTranslations.sort(() => 0.5 - Math.random());
    const finalChoices = [...shuffledWrong.slice(0, 3), correctWord.russian].sort(() => 0.5 - Math.random());
    setChoices(finalChoices);
  };

    const handleGenerateWords = async () => {
    if (!topic.trim()) return;

    setIsLoading(true);
    
    try {
      // Делаем POST-запрос к нашей серверлесс-функции в папке api
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ topic }), // Отправляем тему, введенную пользователем
      });

      if (!response.ok) {
        throw new Error('Ошибка сервера');
      }

      // Получаем слова из ответа
      const aiWords: WordCard[] = await response.json();

      // Обновляем слова и сбрасываем прогресс теста
      setWords(aiWords);
      setCurrentIndex(0);
      setScore(0);
      setIsFinished(false);
      setMode('input'); // Сразу кидаем в режим ввода текста
      setTopic('');
    } catch (error) {
      console.error('Ошибка генерации:', error);
      alert('Не удалось сгенерировать слова. Попробуйте еще раз.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNextWord = () => {
    if (currentIndex >= words.length - 1) {
      setIsFinished(true);
      return;
    }
    const nextIndex = currentIndex + 1;
    setCurrentIndex(nextIndex);
    setUserAnswer('');
    setAnswerStatus('idle');
    setTimeLeft(10);
    if (mode !== null && mode === 'choice') {
      generateChoices(words[nextIndex]);
    }
  };

  const handleCheckAnswer = () => {
    if (answerStatus !== 'idle') return;
    const normalizedAnswer = userAnswer.trim().toLowerCase();
        const correctAnswer = currentWord.russian.trim().toLowerCase();
    if (normalizedAnswer === correctAnswer) {
      setAnswerStatus('correct');
      setScore(score + 1);
      playSound(true);
      setTimeout(() => handleNextWord(), 1500);
    } else {
      setAnswerStatus('incorrect');
      playSound(false);
      setTimeout(() => handleNextWord(), 3000);
    }
  };

  const handleCheckChoice = (choice: string) => {
    if (answerStatus !== 'idle') return;
    if (choice === currentWord.russian) {
      setAnswerStatus('correct');
      setScore(score + 1);
      playSound(true);
      setTimeout(() => handleNextWord(), 1500);
    } else {
      setAnswerStatus('incorrect');
      playSound(false);
      setTimeout(() => handleNextWord(), 1500);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleCheckAnswer();
    }
  };

  useEffect(() => {
    if (mode === null || isFinished || answerStatus !== 'idle') return;
    if (timeLeft <= 0) {
      setAnswerStatus('incorrect');
      playSound(false); 
      setTimeout(() => handleNextWord(), 1500); 
      return;
    }
    const timerId = setTimeout(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(timerId);
  }, [timeLeft, mode, isFinished, answerStatus]);

  const progressPercent = ((currentIndex + 1) / words.length) * 100;

  // Ранние возвраты
  if (mode === null) {
    return (
      <StartScreen 
        setMode={setMode} 
        generateChoices={generateChoices} 
        currentWord={currentWord}
        topic={topic}
        setTopic={setTopic}
        isLoading={isLoading}
        handleGenerateWords={handleGenerateWords}
      />
    );
  }

  if (isFinished) {
    return <ResultScreen score={score} totalWords={words.length} />;
  }

  // Основной экран
  return (
    <Flashcard 
      mode={mode} 
      currentWord={currentWord} 
      timeLeft={timeLeft} 
      userAnswer={userAnswer} 
      answerStatus={answerStatus} 
      choices={choices} 
      progressPercent={progressPercent}
      setUserAnswer={setUserAnswer}
      handleCheckAnswer={handleCheckAnswer}
      handleCheckChoice={handleCheckChoice}
      handleNextWord={handleNextWord}
      handleKeyDown={handleKeyDown}
    />
  );
}

export default App;