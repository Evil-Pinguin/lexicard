import { type Mode, type WordCard } from '../types';

interface StartScreenProps {
  setMode: (mode: Mode) => void;
  generateChoices: (correctWord: WordCard) => void;
  currentWord: WordCard;
  // Новые пропсы для AI
  topic: string;
  setTopic: (topic: string) => void;
  isLoading: boolean;
  handleGenerateWords: () => void;
}

export const StartScreen = ({ 
  setMode, generateChoices, currentWord, topic, setTopic, isLoading, handleGenerateWords 
}: StartScreenProps) => {
  
  // Обработчик нажатия Enter в поле темы
  const handleAiKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isLoading) {
      handleGenerateWords();
    }
  };

  return (
    <div className="app">
      <div className="start-screen">
        <h1>LexiCard</h1>
        
        {/* Блок нейросети */}
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
          <button 
            className="btn btn-primary ai-btn" 
            onClick={handleGenerateWords}
            disabled={isLoading || !topic.trim()}
          >
            {isLoading ? (
              <>
                <span className="spinner"></span> Генерация...
              </>
            ) : 'Сгенерировать слова'}
          </button>
        </div>

        <div className="ai-divider">ИЛИ выберите обычный режим</div>

        {/* Стандартные режимы */}
        <div className="mode-buttons">
          <button className="btn btn-secondary" onClick={() => setMode('input')} disabled={isLoading}>Вписать слово</button>
          <button className="btn btn-secondary" onClick={() => { setMode('choice'); generateChoices(currentWord); }} disabled={isLoading}>Выбрать из вариантов</button>
        </div>
      </div>
    </div>
  );
};