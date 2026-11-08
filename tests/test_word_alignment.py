import importlib.util
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location('word_timing', Path(__file__).parents[1]/'scripts/time-listening-words.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

class AlignmentTests(unittest.TestCase):
    def test_preserves_markup_and_skips_labels(self):
        source = '<p class="transcript-source-note">Draft note</p><p><small>[00:01]</small><strong>Steven:</strong> This is Steven.</p>'
        result, matched, total = module.align(source, [('This', 1, 1.2), ('is', 1.2, 1.4), ('Steven', 1.4, 1.8)])
        self.assertEqual((matched, total), (3, 3))
        self.assertIn('<strong>Steven:</strong>', result)
        self.assertIn('data-cue-start="1.40" data-cue-end="1.80">Steven.</span>', result)

    def test_does_not_invent_clocks_for_unmatched_words(self):
        result, matched, _ = module.align('<p>Hello there missing phrase</p>', [('Hello', 2, 2.5), ('there', 2.5, 3)])
        self.assertEqual(matched, 2)
        self.assertTrue(result.endswith(' missing phrase</p>'))

if __name__ == '__main__':
    unittest.main()
