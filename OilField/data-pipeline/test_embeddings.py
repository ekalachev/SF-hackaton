#!/usr/bin/env python3
"""
Test script to verify Sentence Transformers installation and embeddings generation.

This script:
1. Loads the all-MiniLM-L6-v2 model (FREE!)
2. Generates embeddings for sample oil well descriptions
3. Verifies vectors are 384 dimensions
4. Tests similarity calculations
"""

import sys
from typing import List
import numpy as np
from sentence_transformers import SentenceTransformer


def print_header(text: str) -> None:
    """Print a formatted header."""
    print(f"\n{'='*60}")
    print(f" {text}")
    print(f"{'='*60}\n")


def test_model_loading() -> SentenceTransformer:
    """Test loading the Sentence Transformers model."""
    print_header("Step 1: Loading Model")

    print("Loading all-MiniLM-L6-v2 model...")
    print("(First run will download ~90MB - this is cached for future use)")

    model = SentenceTransformer("all-MiniLM-L6-v2")

    print("✅ Model loaded successfully!")
    return model


def test_embedding_generation(model: SentenceTransformer) -> np.ndarray:
    """Test generating embeddings for sample text."""
    print_header("Step 2: Generating Embeddings")

    sample_text = "Oil well Smith County Well 47A in Smith County, TX. Located in Eagle Ford Shale formation. Current production: 45 bbl/day."

    print(f"Sample text: {sample_text}")
    print("\nGenerating embedding...")

    embedding = model.encode(sample_text)

    print(f"✅ Embedding generated!")
    print(f"   Type: {type(embedding)}")
    print(f"   Shape: {embedding.shape}")
    print(f"   Dimensions: {len(embedding)}")

    return embedding


def test_vector_dimensions(embedding: np.ndarray) -> None:
    """Verify embedding has correct dimensions."""
    print_header("Step 3: Verifying Dimensions")

    expected_dims = 384
    actual_dims = len(embedding)

    print(f"Expected dimensions: {expected_dims}")
    print(f"Actual dimensions: {actual_dims}")

    assert (
        actual_dims == expected_dims
    ), f"Expected {expected_dims} dimensions, got {actual_dims}"

    print(f"✅ Dimensions verified: {actual_dims} dimensions")


def test_similarity_calculation(model: SentenceTransformer) -> None:
    """Test calculating similarity between well descriptions."""
    print_header("Step 4: Testing Similarity Calculation")

    # Sample well descriptions
    wells = [
        "Oil well in Eagle Ford with 45 bbl/day production, 34% undervalued",
        "Oil well in Eagle Ford with 48 bbl/day production, 31% undervalued",
        "Gas well in Permian Basin with 200 mcf/day production, overvalued",
    ]

    print("Sample well descriptions:")
    for i, well in enumerate(wells, 1):
        print(f"  {i}. {well}")

    print("\nGenerating embeddings for all wells...")
    embeddings = model.encode(wells)

    print(f"✅ Generated {len(embeddings)} embeddings")

    # Calculate similarity between wells 1 and 2 (should be high)
    similarity_12 = np.dot(embeddings[0], embeddings[1]) / (
        np.linalg.norm(embeddings[0]) * np.linalg.norm(embeddings[1])
    )

    # Calculate similarity between wells 1 and 3 (should be lower)
    similarity_13 = np.dot(embeddings[0], embeddings[2]) / (
        np.linalg.norm(embeddings[0]) * np.linalg.norm(embeddings[2])
    )

    print(f"\nSimilarity Results:")
    print(f"  Well 1 vs Well 2 (similar wells): {similarity_12:.4f}")
    print(f"  Well 1 vs Well 3 (different wells): {similarity_13:.4f}")

    assert similarity_12 > similarity_13, "Similar wells should have higher similarity!"
    print(f"✅ Similarity calculation working correctly!")


def test_batch_processing(model: SentenceTransformer) -> None:
    """Test batch processing of multiple embeddings."""
    print_header("Step 5: Testing Batch Processing")

    # Generate sample well descriptions
    wells = [
        f"Oil well TX-{i:04d} in Texas with {30+i} bbl/day production"
        for i in range(50)
    ]

    print(f"Batch processing {len(wells)} well descriptions...")

    import time

    start_time = time.time()
    embeddings = model.encode(wells, show_progress_bar=True)
    elapsed_time = time.time() - start_time

    print(f"\n✅ Batch processing complete!")
    print(f"   Processed {len(embeddings)} wells in {elapsed_time:.2f} seconds")
    print(f"   Average: {elapsed_time/len(embeddings)*1000:.1f}ms per well")
    print(f"   Total embeddings shape: {embeddings.shape}")


def main() -> int:
    """Main test function."""
    print("\n" + "=" * 60)
    print(" OilField Embeddings Test Suite")
    print(" Testing Sentence Transformers (all-MiniLM-L6-v2)")
    print("=" * 60)

    try:
        # Step 1: Load model
        model = test_model_loading()

        # Step 2: Generate embedding
        embedding = test_embedding_generation(model)

        # Step 3: Verify dimensions
        test_vector_dimensions(embedding)

        # Step 4: Test similarity
        test_similarity_calculation(model)

        # Step 5: Test batch processing
        test_batch_processing(model)

        # Success summary
        print_header("🎉 All Tests Passed!")
        print("✅ Model loads successfully")
        print("✅ Embeddings are 384 dimensions")
        print("✅ Similarity calculations work correctly")
        print("✅ Batch processing is efficient")
        print("\n🚀 Ready to generate embeddings for oil wells!\n")

        return 0

    except Exception as e:
        print(f"\n❌ Test failed: {e}", file=sys.stderr)
        import traceback

        traceback.print_exc()
        return 1


if __name__ == "__main__":
    sys.exit(main())
