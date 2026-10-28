/**
 * Curated Landmark Academic Papers
 * Embedded directly in the frontend cache to ensure 100% offline and Vercel resilience.
 * Contains Attention Is All You Need, LoRA, FlashAttention, and DeepSeek-R1.
 */

import { PaperDetail, PaperListItem, PaperSection, PaperChunk, PaperSummary } from '../types';

export const TRANSFORMER_SUMMARY: PaperSummary = {
  title: 'Attention Is All You Need',
  authors: ['Ashish Vaswani', 'Noam Shazeer', 'Niki Parmar', 'Jakob Uszkoreit', 'Llion Jones', 'Aidan N. Gomez', 'Łukasz Kaiser', 'Illia Polosukhin'],
  publicationDate: '2017',
  venueOrCategory: 'NeurIPS 2017 (cs.CL)',
  executiveSummary: 'This foundational paper introduces the Transformer, an innovative neural sequence-to-sequence model architecture that dispenses entirely with recurrence (RNNs/LSTMs) and convolutions. The Transformer relies exclusively on stacked multi-head self-attention mechanisms and point-wise fully connected feed-forward networks to model global dependencies between input and output tokens in constant O(1) sequential operations. By replacing sequential recurrence with parallelizable self-attention, the Transformer dramatically accelerated model training while establishing new state-of-the-art benchmarks in machine translation, outperforming previous ensemble systems at a fraction of the compute cost.',
  coreContributions: [
    'Pure Attention Paradigm: Demonstrates that recurrence and convolution can be completely replaced by self-attention mechanisms.',
    'Multi-Head Attention (MHA): Proposes projecting queries, keys, and values into multiple representation subspaces, enabling the model to jointly attend to information from disparate semantic and syntactic positions.',
    'Scaled Dot-Product Attention: Introduces the scaling factor 1 / sqrt(d_k) to counteract vanishing softmax gradients caused by large dot products in high-dimensional spaces.',
    'Sinusoidal Positional Encoding: Formulates fixed frequency-based positional embeddings that allow the model to generalize to sequence lengths beyond those seen during training.',
    'Unprecedented Training Efficiency: Reduced training time for WMT 2014 translation models from weeks on GPU clusters to 3.5 days on 8 P100 GPUs.',
  ],
  methodology: {
    architecture: 'The Transformer adopts a 6-layer encoder-decoder architecture. The encoder stack consists of 6 identical layers, each containing two sub-layers: a Multi-Head Self-Attention module and a Position-wise Feed-Forward Network (FFN), linked with residual connections and layer normalization (Post-LN). The decoder contains 6 identical layers with an additional masked multi-head attention sub-layer to prevent positions from attending to subsequent tokens (autoregressive causal constraint). Dimensionality is set to d_model = 512, with h = 8 parallel attention heads (d_k = d_v = 64) and an inner FFN dimension of d_ff = 2048.',
    keyTechniques: [
      'Scaled Dot-Product Attention: Attention(Q, K, V) = softmax((Q * K^T) / sqrt(d_k)) * V',
      'Multi-Head Projection: MultiHead(Q, K, V) = Concat(head_1, ..., head_h) * W_O',
      'Position-wise Feed-Forward Network: FFN(x) = max(0, x * W_1 + b_1) * W_2 + b_2 with ReLU non-linearity',
      'Residual Connections & LayerNorm: SublayerOutput = LayerNorm(x + Sublayer(x))',
      'Sinusoidal Positional Encodings: PE(pos, 2i) = sin(pos / 10000^(2i/d_model)), PE(pos, 2i+1) = cos(pos / 10000^(2i/d_model))',
      'Regularization & Label Smoothing: 0.1 dropout rate on sub-layers and embeddings, with epsilon_ls = 0.1 label smoothing',
    ],
    benchmarksUsed: [
      'WMT 2014 English-to-German (4.5 million sentence pairs)',
      'WMT 2014 English-to-French (36 million sentence pairs)',
      'Penn Treebank English Constituency Parsing (WSJ section 23)',
    ],
    mathematicalFormulation: 'Attention(Q, K, V) = softmax( (Q K^T) / \\sqrt{d_k} ) V',
  },
  keyFindings: {
    quantitativeResults: [
      'WMT 2014 English-to-German: Base model achieved 27.3 BLEU; Big model achieved 28.4 BLEU, establishing a new SOTA and outperforming best ensemble baselines by +2.0 BLEU.',
      'WMT 2014 English-to-French: Big model achieved 41.8 BLEU, outperforming prior single models while training for only 3.5 days at 1/4 the compute cost of GNMT baselines.',
      'Constituency Parsing: English constituency parsing achieved an F1 of 91.3 with little task-specific tuning, outperforming all prior models except recurrent neural network grammars.',
      'Training Wall-Clock Speed: Base model trained in 12 hours on 8 P100 GPUs; Big model trained in 3.5 days (2.3 x 10^19 FLOPs vs 1.0 x 10^20 for GNMT+RL baselines).',
    ],
    qualitativeInsights: [
      'Analysis of individual attention heads revealed specialized linguistic functions: specific heads attend to long-range pronominal reference (e.g. matching "it" across 15 words to its antecedent noun), while others capture verb-argument structures and clause boundaries.',
      'The attention distribution forms interpretable alignment graphs that clearly show cross-lingual token reordering and grammatical dependency links.',
    ],
  },
  limitations: [
    'Quadratic Computational & Memory Complexity: Self-attention scales as O(n^2 * d) with respect to input sequence length n. For long documents (n > 4096), memory consumption for storing the n x n attention matrix becomes prohibitive without sparse kernels.',
    'Lack of Inductive Bias for Locality: Unlike CNNs which naturally enforce local spatial invariance, the Transformer must learn locality purely through data, necessitating large pre-training datasets to prevent overfitting on small tasks.',
    'Autoregressive Inference Latency: While training is fully parallelized across all tokens, inference remains sequential (generating one token at a time), requiring key-value (KV) caching to avoid recomputing past representations.',
  ],
  practicalImplications: [
    'Foundation of all modern Large Language Models: Directly catalyzed GPT-1/2/3/4, BERT, T5, Gemini, Claude, LLaMA, and modern multimodal diffusion architectures.',
    'Hardware Utilization: Highly dense matrix multiplications (GEMM) match modern GPU/TPU tensor core architectures, maximizing hardware FLOPS utilization compared to memory-bound RNN hidden states.',
  ],
  keyEquationsOrTheorems: [
    {
      label: 'Scaled Dot-Product Attention',
      formulaOrDescription: 'Attention(Q, K, V) = softmax( \\frac{Q K^T}{\\sqrt{d_k}} ) V',
    },
    {
      label: 'Multi-Head Attention Projection',
      formulaOrDescription: 'MultiHead(Q, K, V) = \\text{Concat}(\\text{head}_1, \\dots, \\text{head}_h) W^O',
    },
    {
      label: 'Sinusoidal Positional Encoding',
      formulaOrDescription: 'PE_{(pos, 2i)} = \\sin(pos / 10000^{2i/d_{model}}), \\quad PE_{(pos, 2i+1)} = \\cos(pos / 10000^{2i/d_{model}})',
    },
  ],
  criticalEvaluation: {
    strengths: [
      'Flawless parallelization of training sequences across GPU tensor cores.',
      'Direct connection between any pair of sequence positions with path length O(1), preventing vanishing gradients.',
      'Exceptionally clean, modular architecture that scales predictably with parameters and compute.',
    ],
    weaknesses: [
      'Quadratic memory bottleneck on long sequence lengths was unaddressed in the original paper.',
      'Requires careful learning rate warmup schedules and label smoothing to stabilize training convergence.',
    ],
    potentialBiases: [
      'Evaluated primarily on high-resource Indo-European language pairs (English, German, French) where large parallel corpora were readily available.',
    ],
  },
  bibtexCitation: `@article{vaswani2017attention,
  title={Attention Is All You Need},
  author={Vaswani, Ashish and Shazeer, Noam and Parmar, Niki and Uszkoreit, Jakob and Jones, Llion and Gomez, Aidan N and Kaiser, {\\L}ukasz and Polosukhin, Illia},
  journal={Advances in Neural Information Processing Systems},
  volume={30},
  year={2017}
}`,
  apaCitation: 'Vaswani, A., Shazeer, N., Parmar, N., Uszkoreit, J., Jones, L., Gomez, A. N., Kaiser, Ł., & Polosukhin, I. (2017). Attention is all you need. Advances in Neural Information Processing Systems, 30.',
};

export const TRANSFORMER_SECTIONS: PaperSection[] = [
  {
    id: 'sec_1',
    name: 'Abstract',
    heading: 'Abstract',
    text: 'The dominant sequence transduction models are based on complex recurrent or convolutional neural networks that include an encoder and a decoder. The best performing models also connect the encoder and decoder through an attention mechanism. We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely. Experiments on two machine translation tasks show these models to be superior in quality while being more parallelizable and requiring significantly less time to train.',
    pageStart: 1,
    pageEnd: 1,
    charCount: 520,
  },
  {
    id: 'sec_2',
    name: 'Introduction',
    heading: '1 Introduction',
    text: 'Recurrent neural networks, especially long short-term memory and gated recurrent neural networks, have been firmly established as state of the art approaches in sequence modeling. Recurrent models typically factor computation along the symbol positions of the input and output sequences. This inherently sequential nature precludes parallelization within training examples, which becomes critical at longer sequence lengths. In this work we propose the Transformer, a model architecture eschewing recurrence and instead relying entirely on an attention mechanism to draw global dependencies between input and output.',
    pageStart: 1,
    pageEnd: 2,
    charCount: 650,
  },
  {
    id: 'sec_3',
    name: 'Methodology',
    heading: '3 Model Architecture',
    text: 'The Transformer follows this overall architecture using stacked self-attention and point-wise, fully connected layers for both the encoder and decoder. The encoder is composed of a stack of N = 6 identical layers. Each layer has two sub-layers. The first is a multi-head self-attention mechanism, and the second is a simple, position-wise fully connected feed-forward network. We employ a residual connection around each of the two sub-layers, followed by layer normalization. Multi-head attention allows the model to jointly attend to information from different representation subspaces at different positions.',
    pageStart: 2,
    pageEnd: 5,
    charCount: 640,
  },
  {
    id: 'sec_4',
    name: 'Results & Discussion',
    heading: '5 Results',
    text: 'On the WMT 2014 English-to-German translation task, the big transformer model outperforms the best previously reported models by more than 2.0 BLEU, establishing a new state-of-the-art BLEU score of 28.4. On the WMT 2014 English-to-French translation task, our big model achieves a BLEU score of 41.8, outperforming all previously reported single models, at 1/4 the training cost of the previous state-of-the-art model.',
    pageStart: 6,
    pageEnd: 7,
    charCount: 450,
  },
  {
    id: 'sec_5',
    name: 'Limitations',
    heading: '6 Limitations & Complexity',
    text: 'While self-attention connects all positions with a constant number of sequentially executed operations, its computational complexity per layer is O(n^2 * d), where n is the sequence length and d is the representation dimension. When the sequence length n is very large, self-attention layers can become computationally and memory prohibitive compared to restricted recurrent layers.',
    pageStart: 7,
    pageEnd: 8,
    charCount: 380,
  },
];

export const TRANSFORMER_CHUNKS: PaperChunk[] = TRANSFORMER_SECTIONS.map((sec, i) => ({
  id: `chunk_${i + 1}`,
  sectionName: sec.name,
  heading: sec.heading,
  pageNumber: sec.pageStart,
  text: sec.text,
  charCount: sec.charCount,
  tokenEstimate: Math.round(sec.charCount / 4),
}));

export const LORA_SUMMARY: PaperSummary = {
  title: 'LoRA: Low-Rank Adaptation of Large Language Models',
  authors: ['Edward J. Hu', 'Yelong Shen', 'Phillip Wallis', 'Zeyuan Allen-Zhu', 'Yuanzhi Li', 'Shean Wang', 'Lu Wang', 'Weizhu Chen'],
  publicationDate: '2021',
  venueOrCategory: 'ICLR 2022 (cs.CL)',
  executiveSummary: 'Full parameter fine-tuning of multi-billion parameter foundation models (such as GPT-3 175B) is computationally intractable for individual tasks, requiring hundreds of gigabytes of optimizer states and independent model checkpoints for each specialized downstream domain. This work proposes Low-Rank Adaptation (LoRA), which freezes the pre-trained model weights W_0 and injects trainable rank decomposition matrices (A and B) into each attention layer of the Transformer. By hypothesizing and verifying that weight updates during downstream adaptation have a very low intrinsic rank, LoRA reduces trainable parameters by up to 10,000 times and GPU memory consumption by 3 times, while introducing zero additional inference latency when merged back into the frozen base model weights.',
  coreContributions: [
    'Low-Rank Parameterization Hypothesis: Formulates weight updates Delta W as the product of two low-rank matrices B and A (where rank r << min(d, k)), demonstrating that downstream task adaptations occupy a manifold of extremely low intrinsic dimension.',
    'Zero Inference Latency Overhead: Because W = W_0 + (alpha / r) * B * A, the adapted weights can be linearly added directly into the pre-trained weights W_0 upon deployment, creating zero additional architectural latency or inference compute overhead.',
    'Dramatic Memory & Storage Reduction: Decreases required fine-tuning VRAM from 1.2 Terabytes down to 350 Gigabytes for GPT-3 175B, and slashes per-task checkpoint sizes from 350GB to under 35MB (a 10,000x storage savings).',
    'Modular Multi-Tenant Model Serving: Enables hosting a single frozen 175B foundation model in GPU memory and hot-swapping lightweight task adapters in milliseconds based on user routing.',
  ],
  methodology: {
    architecture: 'LoRA freezes the pre-trained weight matrix W_0 in R^(d x k) across chosen Transformer linear layers (predominantly the attention projection matrices W_q and W_v). It introduces a parallel adapter branch consisting of two matrix multiplications: matrix A in R^(r x k) initialized with random Gaussian noise N(0, sigma^2), and matrix B in R^(d x r) initialized strictly to zero. Consequently, at the beginning of training, the product Delta W = B * A evaluates exactly to zero, guaranteeing that the pre-trained model behavior is unchanged at initialization. The forward pass is computed as h = W_0 * x + (alpha / r) * B * A * x, where alpha is a constant scaling hyperparameter.',
    keyTechniques: [
      'Weight Factorization: W = W_0 + (alpha / r) * B * A, where r is typically chosen between 4 and 16.',
      'Zero Initialization of Matrix B: Ensures training starts exactly from the pre-trained model state without disruption.',
      'Constant Scaling Factor (alpha / r): Stabilizes gradient updates when adjusting the rank r, avoiding the need to retune learning rates.',
      'Targeted Module Injection: Demonstrates that adapting attention projection weights (W_q, W_v) is more parameter-efficient than adapting feed-forward layers or all weight matrices.',
    ],
    benchmarksUsed: [
      'GLUE Benchmark (MNLI, SST-2, MRPC, CoLA, QNLI, QQP, RTE, STS-B) with RoBERTa-large and DeBERTa-XXL',
      'WikiSQL and SAMSum conversational abstractive summarization with GPT-2 and GPT-3 175B',
    ],
    mathematicalFormulation: 'h = W_0 x + \\Delta W x = W_0 x + \\frac{\\alpha}{r} B A x',
  },
  keyFindings: {
    quantitativeResults: [
      'GPT-3 175B on WikiSQL: LoRA achieves 73.8% validation accuracy matching full fine-tuning (73.8%) while training only 0.01% of parameters (4.7M vs 175B).',
      'Memory Efficiency: Training GPT-3 175B with Adam reduces VRAM consumption from 1.2TB down to 350GB on NVIDIA A100 GPUs.',
      'Throughput Gain: Eliminates checkpoint swapping latency; serving multiple task-specific adapters increases batch throughput by 25% compared to separate model instances.',
    ],
    qualitativeInsights: [
      'Subspace Similarity Analysis: Grassmanian distance measurements between learned low-rank subspaces across different random seeds reveal that Delta W directions align tightly, proving adaptation intrinsic dimensions are robust.',
      'Rank Scaling: Surprisingly, rank r = 1 or r = 2 achieves competitive performance on standard downstream benchmarks, confirming intrinsic low-dimensional adaptation.',
    ],
  },
  limitations: [
    'Batch Multiplexing Latency: If multiple tasks are batched simultaneously in a single forward pass without weight merging, separate adapter branches must be dynamically executed, incurring dynamic compute divergence.',
    'Limited Expressivity for Continual Learning: While highly effective for targeted downstream task adaptation, low rank updates may be insufficient for fundamental foundational concept acquisition or vocabulary expansions.',
  ],
  practicalImplications: [
    'Standard Finetuning Protocol: Became the global de facto standard for open-source LLM customization (LLaMA, Mistral, Qwen) and Stable Diffusion personalization (LoRA checkpointing).',
    'Hardware Democratization: Made fine-tuning 70B parameter models feasible on single consumer workstations with 24GB VRAM using QLoRA.',
  ],
  keyEquationsOrTheorems: [
    {
      label: 'LoRA Forward Transformation',
      formulaOrDescription: 'h = W_0 x + \\frac{\\alpha}{r} B A x \\quad (B \\in \\mathbb{R}^{d \\times r}, A \\in \\mathbb{R}^{r \\times k}, r \\ll \\min(d, k))',
    },
  ],
  criticalEvaluation: {
    strengths: [
      'Zero additional inference latency when merged into base weights.',
      'Orders of magnitude storage savings (megabytes instead of gigabytes per checkpoint).',
      'Mathematically elegant and empirically verified.',
    ],
    weaknesses: [
      'Hyperparameter tuning required for rank r and alpha scaling.',
      'Does not adapt embedding tables easily without parameter inflation.',
    ],
    potentialBiases: [
      'Evaluated predominantly on autoregressive text generation and classification benchmarks with English models.',
    ],
  },
  bibtexCitation: `@article{hu2021lora,
  title={LoRA: Low-Rank Adaptation of Large Language Models},
  author={Hu, Edward J and Shen, Yelong and Wallis, Phillip and Allen-Zhu, Zeyuan and Li, Yuanzhi and Wang, Shean and Wang, Lu and Chen, Weizhu},
  journal={arXiv preprint arXiv:2106.09685},
  year={2021}
}`,
  apaCitation: 'Hu, E. J., Shen, Y., Wallis, P., Allen-Zhu, Z., Li, Y., Wang, S., Wang, L., & Chen, W. (2021). LoRA: Low-rank adaptation of large language models. arXiv preprint arXiv:2106.09685.',
};

export const LORA_SECTIONS: PaperSection[] = [
  {
    id: 'sec_1',
    name: 'Abstract',
    heading: 'Abstract',
    text: 'An important paradigm of natural language processing consists of large-scale pre-training on general domain data and adaptation to particular tasks. As we pre-train larger models, full fine-tuning, which retrains all model parameters, becomes less feasible. We propose Low-Rank Adaptation, or LoRA, which freezes the pre-trained model weights and injects trainable rank decomposition matrices into each layer of the Transformer architecture, greatly reducing the number of trainable parameters for downstream tasks.',
    pageStart: 1,
    pageEnd: 1,
    charCount: 520,
  },
  {
    id: 'sec_2',
    name: 'Methodology',
    heading: '4 Method',
    text: 'A neural network contains many dense layers which perform matrix multiplication. The weight matrices in these layers typically have full-rank. When adapting to a specific task, Aghajanyan et al. (2020) shows that the pre-trained language models have a low "intrinsic dimension". Inspired by this, we hypothesize the updates to the weights also have a low "intrinsic rank" during adaptation. For a pre-trained weight matrix W0 in R^(d x k), we constrain its update by representing the latter with a low-rank decomposition W0 + Delta W = W0 + BA, where B in R^(d x r), A in R^(r x k), and the rank r << min(d, k).',
    pageStart: 2,
    pageEnd: 4,
    charCount: 680,
  },
];

export const LORA_CHUNKS: PaperChunk[] = LORA_SECTIONS.map((sec, i) => ({
  id: `chunk_${i + 1}`,
  sectionName: sec.name,
  heading: sec.heading,
  pageNumber: sec.pageStart,
  text: sec.text,
  charCount: sec.charCount,
  tokenEstimate: Math.round(sec.charCount / 4),
}));

export const FLASH_ATTENTION_SUMMARY: PaperSummary = {
  title: 'FlashAttention: Fast and Memory-Efficient Exact Attention with IO-Awareness',
  authors: ['Tri Dao', 'Daniel Y. Fu', 'Stefano Ermon', 'Atri Rudra', 'Christopher Ré'],
  publicationDate: '2022',
  venueOrCategory: 'NeurIPS 2022 (cs.LG)',
  executiveSummary: 'Transformers are slow and memory-intensive on long sequences because the time and memory complexity of standard exact self-attention scales quadratically with sequence length. Existing approximate attention methods trade off model quality to reduce compute complexity. FlashAttention proposes an IO-aware exact attention algorithm that leverages GPU memory hierarchy principles—specifically balancing access between fast GPU SRAM and slow GPU High Bandwidth Memory (HBM). By computing softmax scaling incrementally via tiling and recomputing attention matrices during the backward pass instead of storing them, FlashAttention eliminates intermediate HBM read/write bottlenecks, delivering 2-4x wall-clock speedups while requiring substantially less memory.',
  coreContributions: [
    'IO-Aware Algorithm Design: First attention optimization focused explicitly on minimizing High Bandwidth Memory (HBM) data movement rather than solely counting FLOPs.',
    'Tiling & Online Softmax: Blocks queries, keys, and values to compute self-attention entirely inside fast on-chip SRAM using numerical rescaling.',
    'Gradient Recomputation (Selective Activation Checkpointing): Recomputes softmax scaling factors dynamically in the backward pass, reducing memory from O(N^2) to O(N).',
    'Exact Attention Preservation: Delivers identical numerical outputs to standard attention with zero loss in model perplexity or downstream accuracy.',
  ],
  methodology: {
    architecture: 'Standard GPUs have high-bandwidth SRAM (typically 192KB per streaming multiprocessor on A100) and large HBM (40-80GB). Standard attention performs O(N^2) reads and writes from HBM to compute S = Q*K^T, P = softmax(S), and O = P*V. FlashAttention loads blocks of Q, K, and V into SRAM, computes partial dot-products, maintains running softmax normalizers (max and sum values), and writes out final outputs directly to HBM without ever materializing the N x N attention matrix in memory.',
    keyTechniques: [
      'Tiling: Splits sequence length N into blocks of size B_c and B_r fitting SRAM cache lines.',
      'Online Softmax: Computes m_new = max(m_prev, max(S_block)) and rescales cumulative outputs dynamically.',
      'Kernel Fusion: Implements the forward and backward passes within single fused CUDA kernels.',
    ],
    benchmarksUsed: ['BERT-large on Wikipedia/BookCorpus', 'GPT-2 125M - 1.4B on OpenWebText', 'Long Range Arena (LRA) benchmark'],
    mathematicalFormulation: '\\text{FlashAttention}(Q, K, V) = \\text{TiledOnlineSoftmax}(Q K^T) V',
  },
  keyFindings: {
    quantitativeResults: [
      'BERT-large: Trains 15% faster than MLPerf 1.1 record.',
      'GPT-2 1.4B: 3x wall-clock speedup across sequence length 1K to 8K.',
      'Long Range Arena: Outperforms all existing sparse and low-rank approximation methods in accuracy while matching speed.',
    ],
    qualitativeInsights: [
      'FLOPs vs Memory Wall: Demonstrates that on modern GPUs, matrix operations are memory-bandwidth bound rather than compute bound.',
    ],
  },
  limitations: ['Requires custom CUDA kernels tailored to specific GPU architecture hardware cache sizes.'],
  practicalImplications: ['Enables 32K to 128K context window models in modern foundation architectures.'],
  keyEquationsOrTheorems: [
    {
      label: 'Online Softmax Normalization',
      formulaOrDescription: 'm(x) = \\max(m_1, m_2), \\quad d(x) = e^{m_1 - m(x)} d_1 + e^{m_2 - m(x)} d_2',
    },
  ],
  criticalEvaluation: {
    strengths: ['Mathematically exact with zero accuracy degradation', 'Massive real-world speedups on modern GPU clusters'],
    weaknesses: ['Deep hardware dependency requiring specialized kernel engineering'],
    potentialBiases: ['Evaluated predominantly on NVIDIA Ampere (A100) GPU architectures'],
  },
  bibtexCitation: `@article{dao2022flashattention,
  title={FlashAttention: Fast and Memory-Efficient Exact Attention with IO-Awareness},
  author={Dao, Tri and Fu, Daniel Y and Ermon, Stefano and Rudra, Atri and R{\'e}, Christopher},
  journal={Advances in Neural Information Processing Systems},
  volume={35},
  year={2022}
}`,
  apaCitation: 'Dao, T., Fu, D. Y., Ermon, S., Rudra, A., & Ré, C. (2022). FlashAttention: Fast and memory-efficient exact attention with IO-awareness. Advances in Neural Information Processing Systems, 35.',
};

export const FLASH_ATTENTION_SECTIONS: PaperSection[] = [
  {
    id: 'sec_1',
    name: 'Abstract',
    heading: 'Abstract',
    text: 'Transformers are slow and memory-intensive on long sequences, since the time and memory complexity of self-attention are quadratic in sequence length. Approximate attention methods have attempted to address this problem by trading off model quality to reduce the compute complexity, but often do not achieve wall-clock speedup. We propose FlashAttention, an IO-aware exact attention algorithm that uses tiling to reduce the number of memory reads/writes between GPU high bandwidth memory (HBM) and GPU on-chip SRAM.',
    pageStart: 1,
    pageEnd: 1,
    charCount: 520,
  },
  {
    id: 'sec_2',
    name: 'Methodology',
    heading: '3 FlashAttention: Algorithm and Implementation',
    text: 'Given the inputs Q, K, V in R^(N x d) residing in GPU HBM, FlashAttention computes attention output O in R^(N x d) without materializing the N x N intermediate matrices. We load blocks of Q, K, V into fast SRAM, compute local attention matrices, scale them using online softmax, and continuously accumulate the output. In the backward pass, we recompute intermediate softmax values on the fly from SRAM rather than loading large O(N^2) activations from slow HBM.',
    pageStart: 2,
    pageEnd: 4,
    charCount: 580,
  },
];

export const FLASH_ATTENTION_CHUNKS: PaperChunk[] = FLASH_ATTENTION_SECTIONS.map((sec, i) => ({
  id: `chunk_${i + 1}`,
  sectionName: sec.name,
  heading: sec.heading,
  pageNumber: sec.pageStart,
  text: sec.text,
  charCount: sec.charCount,
  tokenEstimate: Math.round(sec.charCount / 4),
}));

export const DEEPSEEK_R1_SUMMARY: PaperSummary = {
  title: 'DeepSeek-R1: Incentivizing Reasoning Capability in LLMs via Reinforcement Learning',
  authors: ['DeepSeek-AI', 'Daya Guo', 'Dejian Yang', 'Haowei Zhang', 'Junxiao Song', 'Ruoyu Zhang', 'Runxin Xu', 'Qihao Zhu', 'Shirong Ma', 'Peiyi Wang'],
  publicationDate: '2025',
  venueOrCategory: 'arXiv preprint cs.CL (2025)',
  executiveSummary: 'DeepSeek-R1 represents a breakthrough in post-training reasoning paradigms for large language models. The authors introduce DeepSeek-R1-Zero, a model trained via pure large-scale Reinforcement Learning (RL) using Group Relative Policy Optimization (GRPO) without any initial supervised fine-tuning (SFT) data. DeepSeek-R1-Zero demonstrates the spontaneous emergence of sophisticated reasoning behaviors, including self-verification, reflection, backtracking, and long-chain exploration. To overcome linguistic mixing and improve readability, the full DeepSeek-R1 pipeline integrates multi-stage training: cold-start high-quality reasoning SFT, reasoning-oriented RL, rejection sampling, and general RL, matching OpenAI-o1 performance across mathematical reasoning, coding competitions, and scientific benchmarks.',
  coreContributions: [
    'Pure RL Reasoning Emergence: Demonstrates that advanced reasoning capabilities can be incentivized purely through reinforcement learning without supervised demonstration data.',
    'Group Relative Policy Optimization (GRPO): Replaces value network critic estimation with group-normalized baseline rewards, reducing GPU memory by 50% during RL training.',
    'Multi-Stage Training Architecture: Formulates cold-start data collection, reasoning-focused RL, rejection sampling distillation, and alignment with human preference.',
    'Open Distillation Paradigm: Distills reasoning capabilities into dense models (1.5B, 7B, 14B, 32B, 70B based on Qwen and Llama), outperforming open-source baselines by wide margins.',
    'Parity with Proprietary Reasoning Models: Achieves 79.8% Pass@1 on AIME 2024 and 97.3% on MATH-500, rivaling OpenAI-o1-0912.',
  ],
  methodology: {
    architecture: 'DeepSeek-R1 is built upon the DeepSeek-V3 MoE (Mixture-of-Experts) base architecture comprising 671B total parameters with 37B activated per token across 256 routed experts and shared attention. Reinforcement learning is orchestrated using GRPO, which generates a group of outputs {o_1, ..., o_G} for each prompt q, scores each output via rule-based accuracy and format verification, and normalizes advantages across the group.',
    keyTechniques: [
      'Group Relative Policy Optimization: Computes advantage A_i = (R_i - mean(R)) / std(R) across group samples without requiring a memory-intensive critic model',
      'Rule-Based Reward Modeling: Employs deterministic accuracy rewards (e.g. checking mathematical answers and test-case execution for code) and format rewards (enforcing <think>...</think> reasoning blocks)',
      'Cold-Start Demonstration Fine-Tuning: Small curated dataset of thousands of readable long-chain-of-thought traces to eliminate multilingual mixing',
      'Reasoning Distillation: Transfers 800k curated reasoning traces from DeepSeek-R1 into smaller dense student models',
    ],
    benchmarksUsed: [
      'AIME 2024 (American Invitational Mathematics Examination)',
      'MATH-500 (Comprehensive High School Competition Math)',
      'Codeforces (Competitive Programming Rating Benchmark)',
      'MMLU & GPQA Diamond (Graduate-Level Scientific Reasoning)',
    ],
    mathematicalFormulation: 'J_{GRPO}(\\theta) = \\mathbb{E}_{q \\sim P(Q), \\{o_i\\}_{i=1}^G \\sim \\pi_{\\theta_{old}}(O|q)} \\left[ \\frac{1}{G} \\sum_{i=1}^G \\left( \\min\\left( \\frac{\\pi_\\theta(o_i|q)}{\\pi_{\\theta_{old}}(o_i|q)} A_i, \\text{clip}\\left(\\frac{\\pi_\\theta(o_i|q)}{\\pi_{\\theta_{old}}(o_i|q)}, 1-\\epsilon, 1+\\epsilon\\right) A_i \\right) - \\beta D_{KL}(\\pi_\\theta || \\pi_{ref}) \\right) \\right]',
  },
  keyFindings: {
    quantitativeResults: [
      'AIME 2024: DeepSeek-R1 achieves 79.8% Pass@1 (and 92.5% with consensus voting), matching OpenAI-o1 (79.2%).',
      'MATH-500: Reaches 97.3% accuracy, outperforming all previous open and proprietary models.',
      'Codeforces: Achieves a competitive programming rating of 2029 (top 96.3 percentile among human competitive programmers).',
      'Distilled Small Models: DeepSeek-R1-Distill-Qwen-32B achieves 72.6% on AIME 2024, surpassing all open-weight models under 70B.',
    ],
    qualitativeInsights: [
      'Spontaneous emergence of "Aha Moments": During RL training, the model autonomously learned to re-read problem statements, detect internal logical errors, and restart reasoning branches from first principles.',
      'Test-time scaling dynamics: Extending reasoning token length during inference consistently yields higher problem-solving accuracy.',
    ],
  },
  limitations: [
    'Language mixing: Pure RL models occasionally mix English and Chinese within reasoning traces when prompted in multilingual contexts.',
    'Format sensitivity: Requires strict adherence to XML delimiters (<think>...</think>) for downstream parsing.',
    'Software engineering and tool use: Lower performance on multi-turn software development and broad tool orchestration compared to general conversational agents.',
  ],
  practicalImplications: [
    'Democratizes frontier reasoning capabilities without needing proprietary closed APIs.',
    'Provides open distilled model weights (1.5B to 70B) capable of running locally on consumer hardware.',
    'Validates that rule-based verifiers and pure RL can unlock reasoning capabilities beyond human demonstrations.',
  ],
  keyEquationsOrTheorems: [
    {
      label: 'GRPO Advantage Normalization',
      formulaOrDescription: 'A_i = (R_i - \\text{mean}(\\{R_1, ..., R_G\\})) / (\\text{std}(\\{R_1, ..., R_G\\}) + \\epsilon)',
    },
    {
      label: 'Combined Rule-Based Reward',
      formulaOrDescription: 'R_{total} = R_{accuracy} + \\lambda_{format} R_{format} + \\lambda_{language} R_{consistency}',
    },
  ],
  criticalEvaluation: {
    strengths: ['Groundbreaking open-source contribution with fully transparent training recipe', 'State-of-the-art empirical performance matching top closed models'],
    weaknesses: ['Massive compute infrastructure required for reproducing the 671B base model pre-training'],
    potentialBiases: ['Benchmark evaluation focuses predominantly on STEM and formal reasoning rather than creative expression'],
  },
  bibtexCitation: `@article{deepseek2025deepseekr1,
  title={DeepSeek-R1: Incentivizing Reasoning Capability in LLMs via Reinforcement Learning},
  author={DeepSeek-AI and Guo, Daya and Yang, Dejian and Zhang, Haowei and Song, Junxiao and others},
  journal={arXiv preprint arXiv:2501.12948},
  year={2025}
}`,
  apaCitation: 'DeepSeek-AI, Guo, D., Yang, D., Zhang, H., Song, J., et al. (2025). DeepSeek-R1: Incentivizing Reasoning Capability in LLMs via Reinforcement Learning. arXiv preprint arXiv:2501.12948.',
};

export const DEEPSEEK_R1_SECTIONS: PaperSection[] = [
  {
    id: 'sec_1',
    name: 'Abstract',
    heading: 'Abstract',
    text: 'We introduce our first-generation reasoning models, DeepSeek-R1-Zero and DeepSeek-R1. DeepSeek-R1-Zero, a model trained via large-scale reinforcement learning (RL) without supervised fine-tuning (SFT) as a preliminary step, demonstrates remarkable reasoning capabilities. Through RL, DeepSeek-R1-Zero naturally emerges with numerous powerful and intriguing reasoning behaviors. However, it encounters challenges such as poor readability and language mixing. To address these issues and further enhance reasoning performance, we introduce DeepSeek-R1, which incorporates multi-stage training and cold-start data before RL.',
    pageStart: 1,
    pageEnd: 1,
    charCount: 650,
  },
  {
    id: 'sec_2',
    name: 'Methodology & GRPO',
    heading: '2 Approach: Group Relative Policy Optimization',
    text: 'To alleviate the training overhead of traditional actor-critic algorithms like PPO, we adopt Group Relative Policy Optimization (GRPO). Instead of training a separate critic neural network to estimate state values, GRPO samples a group of candidate outputs {o_1, o_2, ..., o_G} for each question and computes relative advantages by comparing the reward of each output against the group baseline. We employ accuracy rewards verified by symbolic or test verifiers and format rewards requiring explicit thinking tags.',
    pageStart: 2,
    pageEnd: 6,
    charCount: 620,
  },
];

export const DEEPSEEK_R1_CHUNKS: PaperChunk[] = DEEPSEEK_R1_SECTIONS.map((sec, i) => ({
  id: `chunk_${i + 1}`,
  sectionName: sec.name,
  heading: sec.heading,
  pageNumber: sec.pageStart,
  text: sec.text,
  charCount: sec.charCount,
  tokenEstimate: Math.round(sec.charCount / 4),
}));

export const LANDMARK_PAPERS: Record<string, PaperDetail> = {
  paper_transformer: {
    id: 'paper_transformer',
    title: 'Attention Is All You Need',
    authors: TRANSFORMER_SUMMARY.authors,
    publicationDate: '2017',
    venueOrCategory: 'NeurIPS 2017 (cs.CL)',
    arxivId: '1706.03762',
    doi: '10.48550/arXiv.1706.03762',
    abstract: TRANSFORMER_SECTIONS[0].text,
    totalPages: 11,
    sections: TRANSFORMER_SECTIONS,
    chunks: TRANSFORMER_CHUNKS,
    summary: TRANSFORMER_SUMMARY,
    sectionCount: TRANSFORMER_SECTIONS.length,
    chunkCount: TRANSFORMER_CHUNKS.length,
    hasSummary: true,
    ingestionSource: 'curated',
    createdAt: '2026-01-01T00:00:00.000Z',
    pdfUrl: 'https://arxiv.org/pdf/1706.03762.pdf',
  },
  paper_lora: {
    id: 'paper_lora',
    title: 'LoRA: Low-Rank Adaptation of Large Language Models',
    authors: LORA_SUMMARY.authors,
    publicationDate: '2021',
    venueOrCategory: 'ICLR 2022 (cs.CL)',
    arxivId: '2106.09685',
    doi: '10.48550/arXiv.2106.09685',
    abstract: LORA_SECTIONS[0].text,
    totalPages: 14,
    sections: LORA_SECTIONS,
    chunks: LORA_CHUNKS,
    summary: LORA_SUMMARY,
    sectionCount: LORA_SECTIONS.length,
    chunkCount: LORA_CHUNKS.length,
    hasSummary: true,
    ingestionSource: 'curated',
    createdAt: '2026-01-02T00:00:00.000Z',
    pdfUrl: 'https://arxiv.org/pdf/2106.09685.pdf',
  },
  paper_flashattention: {
    id: 'paper_flashattention',
    title: 'FlashAttention: Fast and Memory-Efficient Exact Attention with IO-Awareness',
    authors: FLASH_ATTENTION_SUMMARY.authors,
    publicationDate: '2022',
    venueOrCategory: 'NeurIPS 2022 (cs.LG)',
    arxivId: '2205.14135',
    doi: '10.48550/arXiv.2205.14135',
    abstract: FLASH_ATTENTION_SECTIONS[0].text,
    totalPages: 16,
    sections: FLASH_ATTENTION_SECTIONS,
    chunks: FLASH_ATTENTION_CHUNKS,
    summary: FLASH_ATTENTION_SUMMARY,
    sectionCount: FLASH_ATTENTION_SECTIONS.length,
    chunkCount: FLASH_ATTENTION_CHUNKS.length,
    hasSummary: true,
    ingestionSource: 'curated',
    createdAt: '2026-01-03T00:00:00.000Z',
    pdfUrl: 'https://arxiv.org/pdf/2205.14135.pdf',
  },
  paper_deepseek_r1: {
    id: 'paper_deepseek_r1',
    title: 'DeepSeek-R1: Incentivizing Reasoning Capability in LLMs via Reinforcement Learning',
    authors: DEEPSEEK_R1_SUMMARY.authors,
    publicationDate: '2025',
    venueOrCategory: 'arXiv 2025 (cs.CL)',
    arxivId: '2501.12948',
    doi: '10.48550/arXiv.2501.12948',
    abstract: DEEPSEEK_R1_SECTIONS[0].text,
    totalPages: 24,
    sections: DEEPSEEK_R1_SECTIONS,
    chunks: DEEPSEEK_R1_CHUNKS,
    summary: DEEPSEEK_R1_SUMMARY,
    sectionCount: DEEPSEEK_R1_SECTIONS.length,
    chunkCount: DEEPSEEK_R1_CHUNKS.length,
    hasSummary: true,
    ingestionSource: 'curated',
    createdAt: '2026-01-04T00:00:00.000Z',
    pdfUrl: 'https://arxiv.org/pdf/2501.12948.pdf',
  },
};

export function getLandmarkPaperList(): PaperListItem[] {
  return Object.values(LANDMARK_PAPERS).map((p) => ({
    id: p.id,
    userId: p.userId,
    title: p.title,
    authors: p.authors,
    publicationDate: p.publicationDate,
    venueOrCategory: p.venueOrCategory,
    arxivId: p.arxivId,
    doi: p.doi,
    abstract: p.abstract.substring(0, 300) + '...',
    totalPages: p.totalPages,
    sectionCount: p.sections.length,
    chunkCount: p.chunks ? p.chunks.length : p.sections.length,
    hasSummary: !!p.summary,
    ingestionSource: p.ingestionSource,
    createdAt: p.createdAt,
    pdfUrl: p.pdfUrl,
  }));
}
