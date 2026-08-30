import json
import os

def validate_vocabulary():
    # Путь к файлу с карточками слов
    file_path = os.path.join('data', 'vocabulary_base.json')
    
    # 1. Проверка существования файла
    if not os.path.exists(file_path):
        print(f"❌ Ошибка: Файл не найден по пути {file_path}")
        return

    try:
        # 2. Чтение JSON
        with open(file_path, 'r', encoding='utf-8') as f:
            base_data = json.load(f)
            
        print("✅ Синтаксис JSON в порядке! Нет пропущенных запятых или кавычек.")
        
        if "data" not in base_data:
            print("❌ Ошибка: В корне JSON должен быть объект \"data\".")
            return
            
        words_list = base_data["data"]
        print(f"📊 Всего обнаружено слов в базе: {len(words_list)}")
        
        # 3. Валидация структуры и поиск дубликатов
        mandatory_fields = ["word", "grammar", "word_formation", "definition", "synonyms", "ielts_level", "category", "status"]
        errors_found = 0
        seen_words = set()  # Хранилище для проверки дубликатов
        
        for index, item in enumerate(words_list):
            current_word = item.get("word", f"❌ Без имени [Элемент №{index+1}]").strip().lower()
            
            # Проверка на дубликаты
            if "word" in item:
                if current_word in seen_words:
                    print(f"⚠️ Дубликат: Слово '{item['word']}' встретилось в базе повторно (Элемент №{index+1})!")
                    errors_found += 1
                seen_words.add(current_word)

            # Проверяем наличие всех обязательных полей
            for field in mandatory_fields:
                if field not in item or (isinstance(item[field], str) and not item[field].strip()):
                    print(f"⚠️ Внимание: В элементе №{index+1} ('{item.get('word', 'unknown')}') пропущено или пусто поле: '{field}'")
                    errors_found += 1
            
            # Проверяем, что синонимы оформлены как список (массив)
            if "synonyms" in item and not isinstance(item["synonyms"], list):
                print(f"⚠️ Внимание: В элементе №{index+1} ('{item.get('word', 'unknown')}') поле 'synonyms' должно быть списком [], а не строкой!")
                errors_found += 1

        print("\n🏁 --- Итоги валидации ---")
        if errors_found == 0:
            print(f"🚀 Идеально! Все {len(words_list)} карточек заполнены правильно, уникальны и готовы к загрузке в Supabase.")
        else:
            print(f"❌ Найдено ошибок/недочётов в структуре данных: {errors_found}. Исправь их перед миграцией.")

    except json.JSONDecodeError as e:
        print("❌ Жёсткая синтаксическая ошибка в JSON!")
        print(f"Ошибка в строке {e.lineno}, позиция {e.pos}: {e.msg}")
    except Exception as e:
        print(f"❌ Произошла непредвиденная ошибка: {e}")

if __name__ == "__main__":
    validate_vocabulary()
