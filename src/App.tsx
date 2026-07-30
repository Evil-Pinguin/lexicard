import { useState, useEffect } from 'react';
import { words as initialWords } from './data';
import { type Mode, type WordCard, type Direction } from './types';
import { StartScreen } from './components/StartScreen';
import { ResultScreen } from './components/ResultScreen';
import { Flashcard } from './components/Flashcard';

type AnswerStatus = 'idle' | 'correct' | 'incorrect';

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
  const [mode, setMode] = useState<Mode | null>(null); 
  const [choices, setChoices] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [answerStatus, setAnswerStatus] = useState<AnswerStatus>('idle');
  const [score, setScore] = useState<number>(0);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  
  const [timeLeft, setTimeLeft] = useState<number>(10);
  const [words, setWords] = useState<WordCard[]>(initialWords);
  const [topic, setTopic] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [direction, setDirection] = useState<Direction>('en-ru');
  const [mistakeWords, setMistakeWords] = useState<WordCard[]>([]);
  const [isRetryPhase, setIsRetryPhase] = useState<boolean>(false);
  
  // Стейт выученных слов. Читаем из localStorage при загрузке приложения.
  const [learnedWords, setLearnedWords] = useState<WordCard[]>(() => {
    try {
      const saved = localStorage.getItem('lexicard_learned');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [wordCount, setWordCount] = useState<number>(5);

  const [timerDuration, setTimerDuration] = useState<number>(10);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const currentWord = words[currentIndex];

  const generateChoices = (correctWord: WordCard, dir: Direction = direction) => {
    const lang = dir === 'en-ru' ? 'russian' : 'english';
    const wrongTranslations = words.filter(w => w.id !== correctWord.id).map(w => w[lang]);
    const shuffledWrong = wrongTranslations.sort(() => 0.5 - Math.random());
    const finalChoices = [...shuffledWrong.slice(0, 3), correctWord[lang]].sort(() => 0.5 - Math.random());
    setChoices(finalChoices);
  };

    const handleGenerateWords = async (dir: Direction, count: number) => {
    if (!topic.trim()) return;

    setIsLoading(true);
    setDirection(dir);
    setIsRetryPhase(false);
    
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, count }), // Передаем count на бэкенд
      });

      if (!response.ok) throw new Error('Ошибка сервера');

      const aiWords: WordCard[] = await response.json();

      // ЧИНИМ ID: нейросеть их не присылает, поэтому генерируем сами
      const aiWordsWithIds = aiWords.map((w, index) => ({ ...w, id: Date.now() + index }));

      setWords(aiWordsWithIds);
      setCurrentIndex(0);
      setScore(0);
      setMistakeWords([]);
      setIsFinished(false);
      setTimeLeft(timerDuration);
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
    if (currentIndex >= words.length - 1) {
      if (mistakeWords.length > 0 && !isRetryPhase) {
        setWords(mistakeWords);
        setMistakeWords([]);
        setIsRetryPhase(true);
        setCurrentIndex(0);
        setUserAnswer('');
        setAnswerStatus('idle');
        setTimeLeft(timerDuration);
        if (mode !== null && mode === 'choice') {
          generateChoices(mistakeWords[0]);
        }
        return;
      }
      setIsFinished(true);
      return;
    }

    const nextIndex = currentIndex + 1;
    setCurrentIndex(nextIndex);
    setUserAnswer('');
    setAnswerStatus('idle');
    setTimeLeft(timerDuration);
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
      setLearnedWords((prev) => prev.some(w => w.id === currentWord.id) ? prev : [...prev, currentWord]);
      setTimeout(() => handleNextWord(), 1500);
    } else {
      setAnswerStatus('incorrect');
      playSound(false);
      setMistakeWords((prev) => [...prev, currentWord]);
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
      setLearnedWords((prev) => prev.some(w => w.id === currentWord.id) ? prev : [...prev, currentWord]);
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

  // Сохраняем выученные слова в localStorage
  useEffect(() => {
    try {
      localStorage.setItem('lexicard_learned', JSON.stringify(learnedWords));
    } catch (e) {
      console.error('Ошибка сохранения в LocalStorage', e);
    }
  }, [learnedWords]);
    // Применяем тему к документу
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);
  // Таймер
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
        learnedWords={learnedWords}
        wordCount={wordCount}
        setWordCount={setWordCount}
        theme={theme}                    
        setTheme={setTheme}              
        timerDuration={timerDuration}    
        setTimerDuration={setTimerDuration}
      />
    );
  }

  if (isFinished) {
    const initialTotal = isRetryPhase ? words.length : initialWords.length;
    return <ResultScreen score={score} totalWords={initialTotal} hadRetries={isRetryPhase} />;
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