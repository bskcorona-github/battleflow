import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const defaultValue: ThemeContextType = {
  theme: 'light',
  toggleTheme: () => {},
};

const ThemeContext = createContext<ThemeContextType>(defaultValue);

export const useTheme = () => useContext(ThemeContext);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const [theme, setTheme] = useState<Theme>('light');

  // HTMLのclassを更新する関数
  const updateThemeClass = (newTheme: Theme) => {
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  };

  // 初期ロード時にlocalStorageからテーマを取得または
  // システムの設定を使用
  useEffect(() => {
    const storedTheme = localStorage.getItem('theme') as Theme | null;
    
    if (storedTheme) {
      setTheme(storedTheme);
      updateThemeClass(storedTheme);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
      updateThemeClass('dark');
    } else {
      // 明示的にライトモードを設定
      setTheme('light');
      updateThemeClass('light');
    }

    // メディアクエリの変更を監視
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      // localStorageに保存されている場合は優先
      if (!localStorage.getItem('theme')) {
        const newTheme = e.matches ? 'dark' : 'light';
        setTheme(newTheme);
        updateThemeClass(newTheme);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const toggleTheme = () => {
    setTheme((prevTheme) => {
      const newTheme = prevTheme === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', newTheme);
      updateThemeClass(newTheme);
      return newTheme;
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}; 