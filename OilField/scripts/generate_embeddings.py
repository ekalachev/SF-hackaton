#!/usr/bin/env python3
"""
Generate semantic embeddings for oil wells using Sentence Transformers.

This script generates natural language descriptions of wells and creates
384-dimensional embeddings using the all-MiniLM-L6-v2 model for semantic search.

Following SOLID principles:
- Single Responsibility: Each class has one clear purpose
- Open/Closed: Extensible through inheritance
- Liskov Substitution: Concrete implementations follow interfaces
- Interface Segregation: Specific, focused interfaces
- Dependency Inversion: Depends on abstractions

Author: Generated for OilField Hackathon
"""

from typing import List, Dict, Any
from pathlib import Path
import json
from sentence_transformers import SentenceTransformer


class WellDescriptionGenerator:
    """
    Generate natural language descriptions of oil wells.

    Single Responsibility: Only generates text descriptions
    """

    def generate(self, well: Dict[str, Any]) -> str:
        """
        Generate a natural language description of a well.

        Per PGVECTOR_INTEGRATION.md lines 740-755, includes:
        - Well name and operator
        - Location (county, field)
        - Status
        - Current and cumulative production
        - Valuation category
        - Decline rate

        Args:
            well: Dictionary containing well data

        Returns:
            Natural language description string
        """
        # Extract data with safe defaults
        name = well.get('name', 'Unknown')
        operator = well.get('operator', 'Unknown')

        # Location
        location = well.get('location', {})
        county = location.get('county', 'Unknown')
        state = location.get('state', 'TX')
        field = location.get('field', 'unspecified')

        # Status
        status = well.get('status', 'active')

        # Production
        production = well.get('production', {})
        current_bbl_day = production.get('current_bbl_day', 0.0)
        cumulative_bbl = production.get('cumulative_bbl', 0.0)
        decline_rate = production.get('decline_rate', 0.0)

        # Valuation (handle None case)
        valuation = well.get('valuation') or {}
        discount_pct = valuation.get('discount_pct', 0.0)

        # Determine valuation category
        if discount_pct >= 20:
            valuation_category = 'undervalued'
        elif discount_pct <= -20:
            valuation_category = 'overvalued'
        else:
            valuation_category = 'fairly valued'

        # Build description following the template from PGVECTOR_INTEGRATION.md
        description = (
            f"Oil well {name} in {county} County, {state}. "
            f"Located in {field} formation. "
            f"Current production: {current_bbl_day:.1f} bbl/day. "
            f"Status: {status}. "
            f"Valuation: {abs(discount_pct):.1f}% {valuation_category}. "
            f"Decline rate: {decline_rate * 100:.1f}% annually. "
            f"Cumulative production: {cumulative_bbl:,.0f} barrels. "
            f"Operator: {operator}."
        )

        return description


class EmbeddingGenerator:
    """
    Generate embeddings using Sentence Transformers.

    Single Responsibility: Only handles embedding generation
    Open/Closed: Can be extended with different models
    """

    def __init__(self, model_name: str = 'all-MiniLM-L6-v2'):
        """
        Initialize the embedding generator.

        Args:
            model_name: Name of the Sentence Transformer model to use
        """
        self.model_name = model_name
        print(f"Loading Sentence Transformer model: {model_name}...")
        self.model = SentenceTransformer(model_name)
        print("Model loaded successfully!")

    def generate(self, text: str) -> List[float]:
        """
        Generate embedding for the given text.

        Args:
            text: Text to embed

        Returns:
            List of floats representing the embedding (384 dimensions)
        """
        embedding = self.model.encode(text)
        return embedding.tolist()

    def get_model_name(self) -> str:
        """Get the name of the model being used"""
        return self.model_name


class WellEmbeddingProcessor:
    """
    Main processor for adding embeddings to wells.

    Single Responsibility: Orchestrates the embedding pipeline
    Dependency Inversion: Depends on abstractions (description and embedding generators)
    """

    def __init__(self, model_name: str = 'all-MiniLM-L6-v2'):
        """
        Initialize the processor with its dependencies.

        Args:
            model_name: Name of the embedding model to use
        """
        self.description_generator = WellDescriptionGenerator()
        self.embedding_generator = EmbeddingGenerator(model_name)

    def process_well(self, well: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process a single well by adding embedding fields.

        Args:
            well: Well data dictionary

        Returns:
            Well data with added embedding, description, and embeddingModel fields
        """
        # Generate description
        description = self.description_generator.generate(well)

        # Generate embedding
        embedding = self.embedding_generator.generate(description)

        # Add fields to well (immutable approach - create new dict)
        processed_well = {**well}
        processed_well['description'] = description
        processed_well['embedding'] = embedding
        processed_well['embeddingModel'] = self.embedding_generator.get_model_name()

        return processed_well

    def process_wells(self, wells: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Process multiple wells in batch.

        Args:
            wells: List of well data dictionaries

        Returns:
            List of wells with embeddings
        """
        processed_wells = []
        total = len(wells)

        for idx, well in enumerate(wells, 1):
            print(f"Processing well {idx}/{total}: {well.get('name', well.get('id'))}...")
            processed = self.process_well(well)
            processed_wells.append(processed)

        return processed_wells

    def save_wells(self, wells: List[Dict[str, Any]], output_path: Path) -> None:
        """
        Save wells with embeddings to JSON file.

        Args:
            wells: List of wells with embeddings
            output_path: Path to output JSON file
        """
        with open(output_path, 'w') as f:
            json.dump(wells, f, indent=2)

        print(f"Saved {len(wells)} wells with embeddings to {output_path}")


def main():
    """
    Main entry point for the script.

    Reads wells.json, generates embeddings, and writes back to the file.
    """
    # Paths
    base_dir = Path(__file__).parent.parent
    wells_file = base_dir / 'data' / 'processed' / 'wells.json'

    if not wells_file.exists():
        raise FileNotFoundError(f"Wells file not found: {wells_file}")

    # Load wells
    print(f"Loading wells from {wells_file}...")
    with open(wells_file, 'r') as f:
        wells = json.load(f)

    print(f"Loaded {len(wells)} wells")

    # Process wells
    processor = WellEmbeddingProcessor()
    processed_wells = processor.process_wells(wells)

    # Verify all embeddings are 384 dimensions
    print("\nVerifying embeddings...")
    for well in processed_wells:
        assert 'embedding' in well, f"Well {well.get('id')} missing embedding"
        assert len(well['embedding']) == 384, f"Well {well.get('id')} has {len(well['embedding'])} dims instead of 384"
        assert 'embeddingModel' in well, f"Well {well.get('id')} missing embeddingModel"
        assert well['embeddingModel'] == 'all-MiniLM-L6-v2', f"Well {well.get('id')} has wrong model"
        assert 'description' in well, f"Well {well.get('id')} missing description"

    print(f"All {len(processed_wells)} wells have valid 384-dimensional embeddings!")

    # Save back to file
    processor.save_wells(processed_wells, wells_file)

    print("\n=== SUCCESS ===")
    print(f"Generated embeddings for {len(processed_wells)} wells")
    print("Model: all-MiniLM-L6-v2")
    print("Dimensions: 384")
    print(f"Output: {wells_file}")


if __name__ == '__main__':
    main()
