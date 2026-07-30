import { type Dispatch, type SetStateAction } from 'react';

interface SettingsMenuProps {
  theme: 'light' | 'dark';
  setTheme: Dispatch<SetStateAction<'light' | 'dark'>>;
  timerDuration: number;
  setTimerDuration: Dispatch<SetStateAction<number>>;
  onClose: () => void;
}

export const SettingsMenu = ({ theme, setTheme, timerDuration, setTimerDuration, onClose }: SettingsMenuProps) => {
  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <h3>Настройки</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        
        <div className="settings-group">
          <p className="settings-label">Тема оформления</p>
          <div className="settings-buttons">
            <button 
              className={`settings-btn ${theme === 'light' ? 'active' : ''}`}
              onClick={() => setTheme('light')}
            >☀️ Светлая</button>
            <button 
              className={`settings-btn ${theme === 'dark' ? 'active' : ''}`}
              onClick={() => setTheme('dark')}
            >🌙 Темная</button>
          </div>
        </div>

        <div className="settings-group">
          <p className="settings-label">Время на ответ (сек)</p>
          <div className="settings-buttons">
            {[5, 10, 15, 20].map(t => (
              <button 
                key={t}
                className={`settings-btn ${timerDuration === t ? 'active' : ''}`}
                onClick={() => setTimerDuration(t)}
              >{t}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};