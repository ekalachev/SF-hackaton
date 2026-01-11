"""
Tests for generate_embeddings.py script
Following TDD principles - tests written first
"""

import sys
import unittest
import json
import tempfile
from pathlib import Path

# Add scripts directory to path (must be before imports from generate_embeddings)
sys.path.insert(0, str(Path(__file__).parent.parent / 'scripts'))

from generate_embeddings import (  # noqa: E402
    WellDescriptionGenerator,
    EmbeddingGenerator,
    WellEmbeddingProcessor
)


class TestWellDescriptionGenerator(unittest.TestCase):
    """Test well description generation"""

    def setUp(self):
        """Set up test data"""
        self.generator = WellDescriptionGenerator()
        self.sample_well = {
            "id": "TX-0001",
            "name": "Test Well 1A",
            "operator": "Test Operator Inc",
            "location": {
                "county": "Test County",
                "state": "TX",
                "field": "Test Field"
            },
            "status": "active",
            "production": {
                "current_bbl_day": 45.5,
                "cumulative_bbl": 180000.0,
                "decline_rate": 0.15
            },
            "valuation": {
                "discount_pct": 25.0
            }
        }

    def test_generate_description_includes_well_name(self):
        """Description should include well name"""
        description = self.generator.generate(self.sample_well)
        self.assertIn("Test Well 1A", description)

    def test_generate_description_includes_operator(self):
        """Description should include operator name"""
        description = self.generator.generate(self.sample_well)
        self.assertIn("Test Operator Inc", description)

    def test_generate_description_includes_location(self):
        """Description should include location information"""
        description = self.generator.generate(self.sample_well)
        self.assertIn("Test County", description)
        self.assertIn("Test Field", description)

    def test_generate_description_includes_production(self):
        """Description should include production data"""
        description = self.generator.generate(self.sample_well)
        self.assertIn("45.5", description)  # current production
        self.assertIn("180,000", description)  # cumulative production

    def test_generate_description_includes_status(self):
        """Description should include well status"""
        description = self.generator.generate(self.sample_well)
        self.assertIn("active", description)

    def test_generate_description_includes_valuation(self):
        """Description should include valuation information"""
        description = self.generator.generate(self.sample_well)
        self.assertIn("25", description)  # discount percentage
        self.assertIn("undervalued", description.lower())  # valuation category

    def test_generate_description_returns_string(self):
        """Description should be a non-empty string"""
        description = self.generator.generate(self.sample_well)
        self.assertIsInstance(description, str)
        self.assertGreater(len(description), 0)


class TestEmbeddingGenerator(unittest.TestCase):
    """Test embedding generation using Sentence Transformers"""

    def setUp(self):
        """Set up embedding generator"""
        self.generator = EmbeddingGenerator(model_name='all-MiniLM-L6-v2')

    def test_model_loads_successfully(self):
        """Model should load without errors"""
        self.assertIsNotNone(self.generator.model)

    def test_generate_embedding_returns_list(self):
        """Embedding should be a list of floats"""
        embedding = self.generator.generate("Test text for embedding")
        self.assertIsInstance(embedding, list)
        self.assertTrue(all(isinstance(x, float) for x in embedding))

    def test_generate_embedding_has_384_dimensions(self):
        """Embedding should have exactly 384 dimensions"""
        embedding = self.generator.generate("Test text")
        self.assertEqual(len(embedding), 384)

    def test_generate_embedding_different_texts_different_embeddings(self):
        """Different texts should produce different embeddings"""
        embedding1 = self.generator.generate("Oil well in Texas")
        embedding2 = self.generator.generate("Gas well in Oklahoma")
        self.assertNotEqual(embedding1, embedding2)

    def test_generate_embedding_same_text_same_embeddings(self):
        """Same text should produce identical embeddings"""
        text = "Test well description"
        embedding1 = self.generator.generate(text)
        embedding2 = self.generator.generate(text)
        self.assertEqual(embedding1, embedding2)

    def test_get_model_name_returns_correct_name(self):
        """Should return the correct model name"""
        self.assertEqual(self.generator.get_model_name(), 'all-MiniLM-L6-v2')


class TestWellEmbeddingProcessor(unittest.TestCase):
    """Test the main well embedding processor"""

    def setUp(self):
        """Set up processor and test data"""
        self.processor = WellEmbeddingProcessor()
        self.sample_wells = [
            {
                "id": "TX-0001",
                "name": "Well 1",
                "operator": "Operator A",
                "location": {"county": "County A", "state": "TX", "field": "Field A"},
                "status": "active",
                "production": {"current_bbl_day": 50, "cumulative_bbl": 100000},
                "valuation": {"discount_pct": 20}
            },
            {
                "id": "TX-0002",
                "name": "Well 2",
                "operator": "Operator B",
                "location": {"county": "County B", "state": "TX", "field": "Field B"},
                "status": "inactive",
                "production": {"current_bbl_day": 10, "cumulative_bbl": 50000},
                "valuation": {"discount_pct": -15}
            }
        ]

    def test_process_well_adds_embedding_field(self):
        """Processing should add embedding field to well"""
        well = self.sample_wells[0].copy()
        processed = self.processor.process_well(well)
        self.assertIn('embedding', processed)

    def test_process_well_adds_description_field(self):
        """Processing should add description field to well"""
        well = self.sample_wells[0].copy()
        processed = self.processor.process_well(well)
        self.assertIn('description', processed)

    def test_process_well_adds_embedding_model_field(self):
        """Processing should add embeddingModel field to well"""
        well = self.sample_wells[0].copy()
        processed = self.processor.process_well(well)
        self.assertIn('embeddingModel', processed)
        self.assertEqual(processed['embeddingModel'], 'all-MiniLM-L6-v2')

    def test_process_well_embedding_is_384_dimensions(self):
        """Processed well embedding should be 384 dimensions"""
        well = self.sample_wells[0].copy()
        processed = self.processor.process_well(well)
        self.assertEqual(len(processed['embedding']), 384)

    def test_process_well_preserves_original_fields(self):
        """Processing should preserve all original well fields"""
        well = self.sample_wells[0].copy()
        processed = self.processor.process_well(well)
        for key in well.keys():
            self.assertIn(key, processed)

    def test_process_wells_batch_processes_multiple_wells(self):
        """Should process multiple wells in batch"""
        processed = self.processor.process_wells(self.sample_wells)
        self.assertEqual(len(processed), 2)
        self.assertTrue(all('embedding' in w for w in processed))

    def test_save_and_load_wells_with_embeddings(self):
        """Should save and load wells with embeddings correctly"""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            temp_file = Path(f.name)

        try:
            # Process and save
            processed = self.processor.process_wells(self.sample_wells)
            self.processor.save_wells(processed, temp_file)

            # Load and verify
            with open(temp_file, 'r') as f:
                loaded = json.load(f)

            self.assertEqual(len(loaded), 2)
            self.assertTrue(all('embedding' in w for w in loaded))
            self.assertTrue(all(len(w['embedding']) == 384 for w in loaded))
            self.assertTrue(all(w['embeddingModel'] == 'all-MiniLM-L6-v2' for w in loaded))
        finally:
            if temp_file.exists():
                temp_file.unlink()


class TestIntegration(unittest.TestCase):
    """Integration tests for the complete embedding pipeline"""

    def test_full_pipeline_generates_valid_embeddings(self):
        """Test complete pipeline from well data to embeddings"""
        sample_well = {
            "id": "TX-9999",
            "name": "Integration Test Well",
            "operator": "Test Operator",
            "location": {"county": "Test", "state": "TX", "field": "Test Field"},
            "status": "active",
            "production": {"current_bbl_day": 100, "cumulative_bbl": 500000},
            "valuation": {"discount_pct": 30}
        }

        processor = WellEmbeddingProcessor()
        processed = processor.process_well(sample_well)

        # Verify all required fields
        self.assertIn('embedding', processed)
        self.assertIn('description', processed)
        self.assertIn('embeddingModel', processed)

        # Verify embedding quality
        self.assertEqual(len(processed['embedding']), 384)
        self.assertTrue(all(isinstance(x, float) for x in processed['embedding']))

        # Verify description quality
        self.assertIsInstance(processed['description'], str)
        self.assertGreater(len(processed['description']), 50)

        # Verify model name
        self.assertEqual(processed['embeddingModel'], 'all-MiniLM-L6-v2')


if __name__ == '__main__':
    unittest.main()
