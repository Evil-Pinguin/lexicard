import { type Mode, type WordCard, type Direction } from '../types';

interface StartScreenProps {
  setMode: (mode: Mode) => void;
  generateChoices: (correctWord: WordCard, dir?: Direction) => void;
  currentWord: WordCard;
  topic: string;
  setTopic: (topic: string) => void;
  isLoading: boolean;
  handleGenerateWords: (dir: Direction) => void;
}

export const StartScreen = ({ 
  setMode, generateChoices, currentWord, topic, setTopic, isLoading, handleGenerateWords 
}: StartScreenProps) => {
  
  const handleAiKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // По Enter запускаем генерацию в базовом направлении (En -> Ru)
    if (e.key === 'Enter' && !isLoading) {
      handleGenerateWords('en-ru');
    }
  };

  return (
    <div className="app">
      <div className="start-screen">
        <h1>LexiCard</h1>
        
        <div className="ai-section">
          <p>Сгенерировать тест с помощью ИИ:</p>
          <input 
            type="text"
            className="topic-input"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={handleAiKeyDown}
            placeholder="Например: Органы человека"
            disabled={isLoading}
          />
          <div className="ai-direction-buttons">
            <button 
              className="btn btn-primary ai-btn" 
              onClick={() => handleGenerateWords('en-ru')}
              disabled={isLoading || !topic.trim()}
            >
              {isLoading ? 'Генерация...' : 'Англ → Рус'}
            </button>
            <button 
              className="btn btn-primary ai-btn" 
              onClick={() => handleGenerateWords('ru-en')}
              disabled={isLoading || !topic.trim()}
            >
              {isLoading ? 'Генерация...' : 'Рус → Англ'}
            </button>
          </div>
        </div>

        <div className="ai-divider">ИЛИ выберите обычный режим</div>

        <div className="mode-buttons">
          <button className="btn btn-secondary" onClick={() => setMode('input')} disabled={isLoading}>Вписать слово</button>
          <button className="btn btn-secondary" onClick={() => { setMode('choice'); generateChoices(currentWord); }} disabled={isLoading}>Выбрать из вариантов</button>
        </div>
      </div>
    </div>
  );
};