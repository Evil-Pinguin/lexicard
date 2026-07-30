export interface WordCard {
    id: number;
    english: string;
    russian: string;
}

export type Mode = 'input' | 'choice';

export type Direction = 'en-ru' | 'ru-en';