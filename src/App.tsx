import { useState, useEffect } from 'react';
import { words as initialWords } from './data';
import { type Mode, type WordCard, type Direction } from './types';
import { StartScreen } from './components/StartScreen';
import { ResultScreen } from './components/ResultScreen';
import { Flashcard } from './components/Flashcard';

type AnswerStatus = 'idle' | 'correct' | 'incorrect';

// Функция генерации звука
const playSound = (isCorrect: boolean) => {
  const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
  const audioContext = new AudioContext();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  const [timeLeft, setTimeLeft] = useState<number>(10);
  const [mistakeWords, setMistakeWords] = useState<WordCard[]>([]);
  const [isRetryPhase, setIsRetryPhase] = useState<boolean>(false);

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

  // AI стейты и направление перевода
  const [words, setWords] = useState<WordCard[]>(initialWords);
  const [topic, setTopic] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [direction, setDirection] = useState<Direction>('en-ru');

  const currentWord = words[currentIndex];

  const generateChoices = (correctWord: WordCard, dir: Direction = direction) => {
    const lang = dir === 'en-ru' ? 'russian' : 'english';
    const wrongTranslations = words.filter(w => w.id !== correctWord.id).map(w => w[lang]);
    const shuffledWrong = wrongTranslations.sort(() => 0.5 - Math.random());
    const finalChoices = [...shuffledWrong.slice(0, 3), correctWord[lang]].sort(() => 0.5 - Math.random());
    setChoices(finalChoices);
  };

  const handleGenerateWords = async (dir: Direction) => {
    if (!topic.trim()) return;

    setIsLoading(true);
    setDirection(dir); // Устанавливаем направление для всего теста
    
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic }),
      });

      if (!response.ok) throw new Error('Ошибка сервера');

      const aiWords: WordCard[] = await response.json();

      setWords(aiWords);
      setCurrentIndex(0);
      setScore(0);
      setIsFinished(false);
      setMode('input');
      setTopic('');
    } catch (error) {
      console.error('Ошибка генерации:', error);
      alert('Не удалось сгенерировать слова. Попробуйте еще раз.');
    } finally {
      setIsLoading(false);
    }
  };

    const handleNextWord = () => {
    // Если текущее слово — последнее в массиве
    if (currentIndex >= words.length - 1) {
      
      // Проверяем, есть ли ошибки и не находимся ли мы уже в этапе повтора
      if (mistakeWords.length > 0 && !isRetryPhase) {
        // Запускаем этап повтора!
        setWords(mistakeWords);       // Загоняем слова с ошибками как основное массив
        setMistakeWords([]);          // Очищаем массив ошибок, чтобы не зациклиться
        setIsRetryPhase(true);        // Включаем флаг повтора
        setCurrentIndex(0);           // Начинаем с первого слова
        setUserAnswer('');
        setAnswerStatus('idle');
        setTimeLeft(10);
        
        // Если был режим выбора, генерируем кнопки для первого слова повтора
        if (mode !== null && mode === 'choice') {
          generateChoices(mistakeWords[0]);
        }
        return; // Не даем коду идти дальше, остаемся в тесте
      }
      
      // Если этап повтора пройден (или ошибок не было) — завершаем тест
      setIsFinished(true);
      return;
    }

    // Обычный переход к следующему слову
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
    const correctAnswer = direction === 'en-ru' 
      ? currentWord.russian.trim().toLowerCase() 
      : currentWord.english.trim().toLowerCase();

    if (normalizedAnswer === correctAnswer) {
      setAnswerStatus('correct');
      setScore(score + 1);
      playSound(true);
      setTimeout(() => handleNextWord(), 1500);
    } else {
      setAnswerStatus('incorrect');
      playSound(false);
      setMistakeWords((prev) => [...prev, currentWord]); // <-- Добавляем слово в ошибки
      setTimeout(() => handleNextWord(), 1500);
    
    }
  };

  const handleCheckChoice = (choice: string) => {
    if (answerStatus !== 'idle') return;
    const correctChoice = direction === 'en-ru' ? currentWord.russian : currentWord.english;
    
    if (choice === correctChoice) {
      setAnswerStatus('correct');
      setScore(score + 1);
      playSound(true);
      setTimeout(() => handleNextWord(), 1500);
    } else {
      setAnswerStatus('incorrect');
      playSound(false);
      setMistakeWords((prev) => [...prev, currentWord]); 
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
      setMistakeWords((prev) => [...prev, currentWord]); 
      setTimeout(() => handleNextWord(), 1500); 
      return;
    }
    const timerId = setTimeout(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(timerId);
  }, [timeLeft, mode, isFinished, answerStatus]);

  const progressPercent = ((currentIndex + 1) / words.length) * 100;

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

  return (
    <Flashcard 
      mode={mode} 
      currentWord={currentWord} 
      timeLeft={timeLeft} 
      userAnswer={userAnswer} 
      answerStatus={answerStatus} 
      choices={choices} 
      progressPercent={progressPercent}
      direction={direction}
      isRetryPhase={isRetryPhase}
      setUserAnswer={setUserAnswer}
      handleCheckAnswer={handleCheckAnswer}
      handleCheckChoice={handleCheckChoice}
      handleNextWord={handleNextWord}
      handleKeyDown={handleKeyDown}
    />
  );
}

export default App;