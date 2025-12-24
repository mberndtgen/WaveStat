
# WaveStat Rebuild Specification

## 1. Overview
Rebuild the legacy "WaveStat" software (originally developed 30 years ago) as a modern React-based web application. The application performs exploratory Cluster Analysis on image pixels and their Wavelet coefficients to achieve visualization and potential compression.

## 2. Core Features
### 2.1. Image Processing
- **Input**: Support for square grayscale images (standardized to powers of 2 for wavelet transform efficiency).
- **Format**: File upload (JPG, PNG).

### 2.2. Wavelet Engine
- **Transforms**:
    - **Standard**: 1D transform on rows, followed by 1D on resulting columns.
    - **Non-Standard (Pyramidal)**: Standard 2D multiresolution decomposition.
- **Basis Functions**:
    - Haar (Primary)
    - Daubechies (Simplified/Approximated)
- **Levels**: Adjustable decomposition levels (e.g., 1-4).

### 2.3. Cluster Analysis
- **Target**: Cluster raw pixels or wavelet coefficients.
- **Distance Metrics**:
    - Euclidean (r=2)
    - City-block (r=1)
- **Fusion Algorithms (Hierarchical Agglomerative)**:
    - Single Linkage (Nearest Neighbor)
    - Complete Linkage (Furthest Neighbor)
    - Average Linkage
    - Ward's Method (for minimizing variance)
- **Optimization**: Since full Agglomerative clustering is $O(N^2)$, implement a performance-optimized version for the browser (e.g., using K-Means as a proxy or sub-sampling for large coefficients).

### 2.4. Reconstruction & Visualization
- **Clustered Representation**: Color-coded visualization where each cluster ID is assigned a unique color.
- **Reconstruction**: Replace each data point with its cluster centroid (average value) and perform Inverse Wavelet Transform.
- **Comparison**: Side-by-side display of Original vs. Reconstructed images.
- **Difference View**: Visual representation of the reconstruction error.

## 3. Technical Stack
- **Framework**: React 18+ with TypeScript.
- **Styling**: Tailwind CSS.
- **Math**: Custom implementations of Haar DWT and clustering logic.
- **Visualization**: Canvas API for efficient image data manipulation.

## 4. Tasks
- [x] Create project structure and UI layout.
- [x] Implement Grayscale Image processing and Canvas helpers.
- [x] Build Wavelet Transform (DWT/IDWT) module.
- [x] Build Clustering Engine with multiple linkage/distance options.
- [x] Integrate pipeline: Input -> Transform -> Cluster -> Average -> Inverse -> Output.
- [x] Implement visualization components (Clustered View, Difference View).
