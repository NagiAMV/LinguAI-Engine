import json
import os

def validate_vocabulary():
    # Путь к файлу с карточками слов
    file_path = os.path.join('data', 'vocabulary_base.json')
    
    # 1. Проверяка файла существование
    if not os.path.exists(file_path):
        print(f"❌ Ошибка: Файл не найден по пути {file_path}")
        return

    try:
        # 2. Пробуем прочитать JSON (проверка на синтаксис, запятые и кавычки)
        with open(file_path, 'r', encoding='utf-8') as f:
            base_data = json.load(f)
            
        print("✅ Синтаксис JSON в порядке! Нет пропущенных запятых или кавычек.")
        
        # Проверяем структуру внутри блока "data"
        if "data" not in base_data:
            print("❌ Ошибка: В корне JSON должен быть объект \"data\".")
            return
            
        words_list = base_data["data"]
        print(f"📊 Всего обнаружено слов в базе: {len(words_list)}")
        
        # 3. Проверяем структуру каждого отдельного слова
        mandatory_fields = ["grammar", "word_formation", "definition", "synonyms", "ielts_level", "category", "status"]
        errors_found = 0
        
        for index, item in enumerate(words_list):
            # Проверяем наличие всех обязательных полей
            for field in mandatory_fields:
                if field not in item:
                    print(f"⚠️ Внимание: В элементе №{index+1} пропущено обязательное поле: '{field}'")
                    errors_found += 1
            
            # Проверяем, что синонимы оформлены как список (массив)
            if "synonyms" in item and not isinstance(item["synonyms"], list):
                print(f"⚠️ Внимание: В элементе №{index+1} поле 'synonyms' должно быть списком (в квадратных скобках []), а не строкой!")
                errors_found += 1

        if errors_found == 0:
            print("🚀 Идеально! Все карточки заполнены правильно и готовы к загрузке в Supabase.")
        else:
            print(f"❌ Найдено мелких недочётов в структуре: {errors_found}. Исправь их перед коммитом.")

    except json.JSONDecodeError as e:
        print("❌ Жёсткая синтаксическая ошибка в JSON!")
        print(f"Ошибка в строке {e.lineno}, позиция {e.pos}: {e.msg}")
    except Exception as e:
        print(f"❌ Произошла непредвиденная ошибка: {e}")

if __name__ == "__main__":
    validate_vocabulary()
