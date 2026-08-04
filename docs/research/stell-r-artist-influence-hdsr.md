---
abstract: |
  Given the central role of online recommendation systems amid rapidly
  growing volumes of digital content, and the fundamental limitations of
  traditional music recommendation systems (MRS), this work proposes a
  novel approach for generating music recommendations based on the
  construction and traversal of a knowledge graph built on the detection
  of review-based connections between musical artists. \
  \
  The core idea behind our approach is essentially emulating the humanly
  unfeasible process of exhaustively reading through an arbitrary-length
  sequence of high-quality music reviews, using any given artist(s) as a
  starting point and hopping from one review to the next, according to
  the list of the different artists sequentially discovered after each
  review read. Artist connections are established hierarchically, first
  by review-based semantic distance, later prioritizing searches by
  sonic similarity. We hypothesize that these two metrics, in tandem,
  can be plausibly interpreted as musical influence in this context,
  providing unique and underexplored avenues for music discovery and
  recommendation.\
  \
  We demonstrate, after implementing our methodology using a
  comprehensive real-world album review corpus, that the resulting
  artist network displays strong musicological coherence, adequately
  mapping mutual artistic influence, and that our pilot implementation
  can match, and in some cases outperform, traditional MRS frameworks in
  terms of user satisfaction. These findings suggest that our approach
  offers unique music discovery capabilities, while minimizing user data
  privacy risks and introducing potential computational efficiencies by
  forgoing the continuous and expensive model retraining and deployment
  required by conventional machine learning-based MRS.\
  \
  The [Methodology section](#methodology "null") explains in technical
  detail how the knowledge graph is built, how connections between
  artists are drawn, and how this graph can be enhanced with sonic
  attributes and traversed to produce music recommendations in the form
  of optimal sequences of artists and songs. The [Implementation
  section](#implementation "null") introduces a real-world application
  of this framework using reviews from several reputable online music
  publications and presents some of the resulting graph properties and a
  publicly available interactive tool built on top of it. The
  [Validation section](#validation "null") consists of a two-pronged
  evaluation. First, we conduct network analysis on the resulting
  22,831-artist graph, where findings reveal high musicological
  coherence, with distinct communities aligning with recognized musical
  styles, while correctly identifying seminal bridge artists connecting
  disparate musical territories. Second, a simulation-based exercise
  demonstrates that the implementation can achieve user satisfaction
  levels statistically equivalent to collaborative filtering while
  outperforming it among high-openness users and providing superior
  bridge artist discovery capabilities across all user types.
affiliation:
- id: 0
  organization: Department of Public Health Sciences, The University of
    Chicago, Chicago, Illinois, United States of America
- id: 1
  organization: Department of Biostatistics, Johns Hopkins Bloomberg
    School of Public Health, Johns Hopkins University, Baltimore,
    Maryland, United States of America
article:
  doi: 10.1162/99608f92.fb935f61
  elocation-id: t4txmd81
  issue: 4
  volume: 7
author:
- Elena Badillo-Goicoechea
bibliography: /tmp/tmp-61ihLaXXlGgH3Y.json
copyright:
  link: "https://creativecommons.org/licenses/by/4.0/"
  text: Creative Commons Attribution 4.0 International License
  type: CC-BY
csl: /app/dist/server/server/utils/citations/citeStyles/apa-7th-edition.csl
date:
  day: 03
  month: 12
  year: 2025
journal:
  eissn: 2644-2353
  publisher-name: The MIT Press
  title: Harvard Data Science Review
link-citations: true
title: "Modeling Artist Influence for Music Selection and
  Recommendation: A Purely Network-Based Approach"
uri: "https://hdsr.mitpress.mit.edu/pub/t4txmd81"
---

**Keywords:** music recommendation systems, content-based
recommendations, network analysis

------------------------------------------------------------------------

# 1. Background

Digital platforms have made online content more widely and readily
available than in any previous period [@n82i9dasfmz]. This has created a
strong need for consumers to be assisted when deciding among different
options, since considering and ranking them all is no longer a humanly
feasible task. In the music sector alone, the Spotify service, arguably
the major streaming service in the industry, offered a catalog of 70+
million songs, as of December 2020 [@n33z8bzqm2r]. To address this need,
automated recommendation systems have become widespread, turning into a
central piece of web services and of people's lives. In this
context---and in parallel with rapid theoretical and computational
advancements in machine learning-based predictive
methods---collaborative filtering and user-item interaction (UII) models
have become prevalent. With some methodological variations, these are
primarily based on the recorded history of interactions between users
and the platform (e.g., clicks, likes), and are used to produce
recommendations that are expected to satisfy the user, given a
predefined set of observed correlates that are considered predictive of
their musical preferences, including platform usage, sociodemographic
profiles, and similarity to other users.

While overall effective, efficient, and widely adopted, UII-based
frameworks come with inherent limitations that both tend to limit users'
long-term satisfaction [@ndwsvr3pk9l] and entail high costs for
platforms (in terms of computational resources, privacy oversight,
platform usage dependency, lack of interpretability/transparency, and
loss of engagement). More concretely, these limitations, which affect
all stakeholders, namely, users, artists, and platforms, include the
cold-start problem [@nku2sjp3hgq], silo effects/filter bubbles
[@ne9fyrqcvuj], industry/institutional/popularity biases [@nksqs6gj6i5],
and ever-growing computational costs trade-offs from information
overload as users' platform usage log increases in time [@nwhcppqgvw8].
Nevertheless, the UII plus machine learning paradigm remains widely
prevalent in music recommendation systems (MRS), adopted by practically
all major streaming platforms, limiting or negatively impacting user
experience. In this sense, more methodological diversity in the way MRS
are designed is not only desirable, from a theoretical perspective, but
also increasingly necessary from a user and artist perspective, allowing
music listeners to benefit from selectively using different types of
systems in tandem (e.g., mechanisms favoring musical discovery,
maintaining specific 'moods,' or yielding little deviation from the
user's previous listening history); prioritizing quality over mediatic
exposure (e.g., advertising, gatekeeping); and facilitating algorithmic
transparency.

In spite of this growing need, relatively few high-quality research
studies have focused on developing and implementing algorithmic
approaches that fundamentally overcome these important limitations.
Moreover, most of that work has focused on proposing hybrid methods for
combining ordered recommended items in user-specific ranked lists, each
item list sorted by different types of recommendation algorithms
(including content-based ones). [@n96uigyy72p], for instance, proposed a
stochastic label aggregation method that randomly selects a label per
training example according to a given distribution over the labels.
[@n30gmlrqvpw] further proposed a framework that optimally combines a
reinforcement learning approach from a fixed offline batch of data for
long-term user satisfaction with potential high-value actions impacting
short-term satisfaction with good predictive performance. Although many
of the challenges UII systems face have been acknowledged, as thoroughly
summarized by [@nnyw8m048x7] for music recommendation contexts
specifically, their main limitations have not been fundamentally
addressed: the UII paradigm continues to dominate MRS applications, and
more innovative context-based approaches have been mostly used within
hybrid approaches merely to alleviate the cold start problem or blending
them with algorithms higher in the hierarchy. Thus, the inertial
component of UII systems is often naturally still reflected on the final
list: ultimately, the models are machine learning-based and predictive
in nature, trained with the platform user as the unit of analysis and
user interactions with the platforms as outcomes, and the growth of the
platform as an end-goal. Furthermore, hybrid approaches do not provide
the user with flexibility over the type of recommendation model they
would like to use, depending on their context and needs. We conjecture
that music recommendation models generated under the framework we
present here are sufficiently rich to: 1) not necessitate real-time user
personal information nor their history of interactions with platform as
inputs; 2) complement other approaches in such a way that the user is in
control of the methodology utilized, allowing them to be more in control
of their musical discovery path.

In sum, as the amount of available music increases, the task of
producing satisfactory recommendations---particularly for consumers with
more complex music tastes and listening habits---becomes harder and
computationally costly. There is an emerging and growing consensus that
MRS needs to evolve and be rethought beyond UII and predictive
frameworks, as [@nkr0wb8h846] argue in a recent systematic review on the
current state of MRS. To address these fundamental limitations, this
work introduces a fundamentally different approach that leverages the
rich semantic content embedded in expert music criticism.

This work introduces a novel, efficient, and automated selection music
recommendation model purely based on the semantic distance between
artists embedded in dozens of thousands of publicly available music
reviews from diverse reputable sources, naturally generating a knowledge
graph with a structure further enhanced with sonic similarity. Its unit
of analysis being the artist---as opposed to the user itself---this
framework naturally lacks some of the limitations that UII systems face,
while containing enough signal to make the final item of recommendation
artistically meaningful due to its semantically rich information
retrieval mechanism. While knowledge graphs have long been implemented
and used for online search recommendations (e.g., PageRank algorithm
developed by Google) they have not, to the best of our knowledge, been
fully leveraged to extract---and make sense of---the massive amount of
high-quality musical criticism to produce music recommendations purely
based on its emerging network properties and inferred relationships
between artists.

This novel approach fits best into the content-based framework as
described [@nvrpa9qbizt] and [@nsy7mjskipa], and coincides with
knowledge graph approaches for product recommendations more broadly
[@n9km85j698p]. However, to the best of our knowledge, even within
content-based frameworks, it is the first to devise a musical
recommendation system based purely on network-based mechanisms where a
knowledge graph is constructed by leveraging and condensing the rich
information embedded in texts written by musical experts, to then
naturally exploit and adapt graph-theoretic approaches to recommend
artists or songs.

One of key innovations in our approach is noticing and exploiting the
unique interpretability of the information retrieval process that expert
long-form music journalism lends itself to. While music criticism and
analysis can vary widely, stylistically speaking, an almost ubiquitous
factor is the author's tendency to detect and mention other artists
that, in their informed view, have strongly influenced the artist in
question. Two recent clear cases taken from leading music publications,
*Pitchfork* and *The Quietus*, respectively, exemplify such narrative
structure: 1) "Verraco's music is equally informed by the brain-bending
sounds of *Aphex Twin*, *Autechre*, and other UK electronic pioneers,
along with the psychedelia of artists like *James Holden* and the
darkside electro of *Rotterdam and The Hague*" [@nrzla2e5bkj]; 2)

> Martha Skye Murphy's debut album has been a long time in coming even
> if she's still in her twenties. Collaborations with *Squid* and
> *Maxwell Stirling* are in the recent and distant past, and most
> famously there's an association with *Nick Cave* that goes back to her
> singing over the opening credits of John Hillcoat's The Proposition as
> a nine-year-old. South London-born Murphy also later performed backing
> vocals on Push The Sky Away, and has apparently been mentored by the
> Bad Seeds leader ever since Hillcoat's 2005 Australian western.
> [@nains7j5fdy]

While these examples illustrate clear cases of stylistic influence, our
operational definition of 'influence' is intentionally loose. Our
methodology treats any mention of one artist in another's review corpus
as evidence of artistic connection, encompassing not only direct
stylistic influence but also collaborations, mentorships, shared scenes,
and comparative references. This inclusive approach reflects the reality
that musical relationships exist along a spectrum---from direct sonic
influence to cultural associations---and that expert music critics
mention artists for various contextually relevant reasons. Rather than
attempting to parse the specific nature of each mention (a task that
would require sophisticated sentiment and relationship analysis), we
posit that the aggregate pattern of co-mentions across thousands of
reviews provides a meaningful proxy for the broader concept of artistic
significance within musical discourse. This operational choice trades
precision in individual connections for comprehensiveness in capturing
the full ecosystem of artistic relationships as perceived by expert
critics.

The core idea behind this novel approach is highly intuitive: it
emulates the process of an individual reading a sequence of high-quality
music reviews where the sequence starting point is a review for a given
artist from a reputable music blog, and where the most salient aspect of
the review is the list of other artists mentioned in the text. We
conjecture that this process yields new, meaningful sequences of artists
and songs with an ex ante high-intrinsic likelihood of being
satisfactory to the user, with no other previous information required
other than the starting point they establish. Reading music journalism
and criticism is one of the most successful and rewarding musical
discovery methods, yet has been notoriously overlooked by current MRS.
This approach is thus the first to closely and efficiently emulate the
humanly unfeasible scenario of exhaustively reading through an
arbitrary-length semantically linked sequence of expert music journalism
and criticism pieces, storing the names of the artists along the path
and all their connecting paths.

# 2. Methodology

The methodology we propose follows a three-stage approach. First, a
comprehensive data set pulled from album reviews is constructed. Then, a
set of mutual artist relationships is extracted aided by natural
language processing. Finally, we implement various graph traversal
algorithms that leverage both topological and sonic distance to generate
personalized music recommendations. These relationships are complemented
with data-driven sonic similarity measures derived from audio song
features aggregated to the artist level to capture additional stylistic
connections during graph traversal.

## 2.1. Data Collection and Preprocessing

We collected a data set of unique album reviews along with their
metadata (artist name, album title, release date, publication name) from
a predefined set of music publications, adhering to ethical web-scraping
practices [@nm74lq4ofr0]. From this collection, we generated a primary
list of unique artists---an artist appears on this list if and only if
at least one of their albums was reviewed by any included publication.
It is important to note that the corpus exclusively contains
*album-level* reviews rather than individual song reviews, as the type
of long-form criticism typically published by these outlets rarely
addresses songs in isolation. Consequently, all textual data used for
graph construction refer to the album as the fundamental reviewed unit.
In cases where multiple publications have reviewed the same album, these
reviews are aggregated under the corresponding artist's corpus prior to
mention detection, thus, effectively treating the collection of all
reviews about that artist as a single concatenated text source. This
design choice preserved the artist-level nature of the influence
relationships extracted from the corpus.

## 2.2. Graph Construction

We construct a directed artist influence graph where nodes represent
artists and edges represent potential influence relationships derived
from critical discourse. Specifically, we establish a directed edge from
artist $S_i$ to artist $S_j$ whenever $S_i$ is mentioned in reviews of
$S_j$'s albums. The edge weight corresponds to the number of such
mentions, interpreted as a measure of $S_i$'s influence on or similarity
to $S_j$.

Formally, given a set of $K$ musical artists
$\mathcal{S} = \{S_1, S_2, \ldots, S_K\}$ and their corresponding review
corpora $\mathcal{R} = \{R_1, R_2, \ldots, R_K\}$, we construct an
adjacency matrix $\mathbf{A}$ where each element $a_{ij}$ represents the
number of times artist $S_i$ is mentioned in the review corpus $R_j$ of
artist $S_j$ (for $i \neq j$). This matrix defines a directed graph $G$
where an edge from $S_i$ to $S_j$ exists if and only if $a_{ij} > 0$,
with edge weight $a_{ij}$ reflecting the strength of potential
influence.

Each node also stores temporal information: we calculate a
representative release date for each artist as the median album release
year across their review corpus. We chose the median to reduce
sensitivity to outliers (e.g., reissues or compilations) while better
representing the artist's primary active period. This temporal attribute
enables chronological filtering in recommendation algorithms, allowing
users to discover artists from specific eras and trace influence
patterns across time periods.

To ensure more precise artist identification and meaningful connections,
we employ several preprocessing steps and safeguards:

### 2.2.1. Text Preprocessing

We first clean the review corpus by removing special characters and
applying a curated stop word list, while retaining words like 'The' and
'a' that often form part of band names. All text and artist names are
lowercased to reduce false negatives due to stylistic variation.

### 2.2.2. Mention Detection

For each potential artist pair $(i,j)$ where $i \neq j$, we scan each
review in $R_j$ to count mentions of artist $S_i$. We employ four
safeguards to ensure accurate identification:

1.  Named entity recognition to confirm artist $i$ appears as a proper
    noun in musical context

2.  Exclusion of matches where artist $i$'s name is identical to the
    album title under review

3.  Application of manually curated ad hoc normalization rules for known
    name variants (e.g., 'Florence and the Machine' vs. 'Florence + The
    Machine')

4.  Contextual validation within the surrounding paragraph to ensure
    musical relevance

Our current approach treats all mentions as positive indicators of
influence or similarity. While mentions explicitly denying influence
(e.g., 'Artist A sounds nothing like Artist B') would still generate
edges in our graph, such negative comparisons are exceptionally rare in
professional music criticism---reviewers seldom dedicate space to
enumerate artists that *do not* sound like the reviewed artist.
Distinguishing mention sentiment would require extensive manual
annotation for supervised learning, which we leave for future work.
Given that name drops in music reviews typically indicate positive
stylistic connection or influence, this simplification provides a
reasonable and interpretable approximation for our recommendation
system.

## 2.3. Sonic Similarity Weights

To avoid arbitrary weighting of sonic features when characterizing an
artist's musical catalog, we derive empirically grounded weights through
a genre multiclassification task. Specifically, we train a single-layer
perceptron to predict artist genre using normalized sonic features as
predictors, then extract and normalize the learned feature weights. This
approach provides interpretable weights since the model has no hidden
layers---while leveraging the neural network architecture's natural
ability to carry out multiclass classification. Although more complex
model architectures would yield higher classification accuracy, our
objective is not optimal genre prediction but rather obtaining
meaningful feature weights that capture how different sonic properties
contribute to musical characterization. It is important to note that
preestablished musical genres are only used in this step of the
methodology (e.g., never used during the graph construction or music
selection algorithms), and even in this step, they are used indirectly.

## 2.4. Music Selection Algorithms

The constructed influence graph enables various recommendation
strategies through adapted graph traversal algorithms. We transform
co-mention counts into appropriate metrics depending on the algorithm:
for distance-based methods (e.g., Dijkstra's shortest path), we use the
transformation $d_{ij} = \frac{1}{a_{ij} + 1}$ to convert high
co-mention counts into short semantic distances; for similarity-based
methods (e.g., breadth-first search, max-flow), we use raw co-mention
counts $a_{ij}$ directly as edge weights.

We implement four primary traversal strategies, each addressing
different recommendation objectives: (1) breadth-first search (BFS)
[@ncg1w6ukdoc]; [@nlpv0uq7n5f]; (2) shortest path between artists
[@nqbbbp5ah6u]; (3) maximal influence path via max-flow [@njhie83geqt];
and (4) multiartist network intersections. These base algorithms are
enhanced with sonic similarity filtering, chronological sorting, and
controlled randomization to produce varied recommendations while
maintaining musical coherence. Detailed pseudocode for all algorithms is
provided in [Appendix A](#appendices "null").

### 2.4.1. *K*-length BFS Traversal With Sonic Similarity Filtering

This algorithm extends classical BFS with sonic similarity constraints
to ensure musical coherence. Starting from a source artist, the
algorithm explores neighbors breadth-first while applying a weighted
Euclidean distance check based on the sonic feature vectors (using
weights derived from genre classification). The distance threshold
ensures only sonically similar artists are added to the recommendation
list. If the target list size $K$ cannot be reached with the initial
threshold, the algorithm progressively relaxes this constraint until $K$
recommendations are obtained, balancing sonic similarity with graph
connectivity. The weighted Euclidean distance between artists $i$ and
$j$ is computed as:

$$d_{sonic}(i,j) = \sqrt{\sum_{f=1}^{10} w_f (x_{if} - x_{jf})^2}$$

where $w_f$ represents the feature weight for sonic feature $f$, and
$x_{if}$ denotes artist $i$'s value for feature $f$.

### 2.4.2. Shortest Influence Path Between Two Artists

This algorithm identifies the path of strongest cumulative influence
between any two artists using Dijkstra's shortest path algorithm with
transformed edge weights. Since high co-mention counts indicate strong
influence, we apply the transformation $d_{ij} = \frac{1}{a_{ij} + 1}$
to convert influence strength into semantic distance. The resulting path
minimizes cumulative distance (equivalently, maximizes cumulative
influence), with artists sorted chronologically by median album release
year to reveal temporal influence progression.

### 2.4.3. Maximal Influence Path

Using the Edmonds-Karp max-flow algorithm, this approach identifies the
route carrying the highest total influence between two artists. Unlike
shortest path algorithms that minimize cumulative distance, max-flow
accounts for all possible influence channels between artists, finding
the path with maximum capacity for influence transmission. Edge
capacities correspond directly to co-mention counts $a_{ij}$,
representing influence strength from artist $i$ to artist $j$. The
resulting path reveals the strongest overall influence connection, with
chronological sorting providing temporal context.

### 2.4.4. Multiartist BFS With Dynamic Root Updates

This variant allows users to specify multiple starting artists, finding
recommendations at the intersection of their influence networks. The
algorithm maintains a dynamic set of 'root' vertices, updating after
each traversal layer to focus on the most recent intersection of
neighbors. The search proceeds through increasingly distant neighbor
intersections until either $K$ recommendations are found or no further
intersections exist. If the target size is not reached through
intersections alone, the algorithm randomly samples from the most recent
layer's artists to complete the list, ensuring consistent output size
while prioritizing strongly connected artists.

### 2.4.5. Representative Song Selection

After any traversal algorithm produces a *K*-length artist list, we
generate a corresponding playlist through stratified sampling. For each
recommended artist, we retrieve their $M$ most popular songs (according
to streaming platform metrics), then randomly select one song per
artist. This approach balances artist representation with song
popularity, producing playlists that showcase each recommended artist
while maintaining accessibility through well-known tracks. The random
selection within each artist\'s top songs ensures playlist variety
across multiple generations for the same artist sequence. Detailed
procedures for all algorithms are presented in [Appendix
A](#appendices "null").

# 3. Implementation

We implement the proposed framework using real-world music publications
to construct a semantically rich network of musical artists and
demonstrate its application through an interactive web platform. This
section details the data collection, graph construction, sonic feature
extraction processes, and example use cases. All analyses were done
using Python 3.12.

## 3.1. Data Collection

We compiled 61,186 album reviews from seven online music publications,
selected to provide comprehensive coverage across genres, time periods,
and critical perspectives. [Table
1](#table-1-music-publication-sources "null") summarizes the
characteristics of these sources, which span from retrospective reviews
of January 1959 albums to contemporary releases through April 2025.

#### Table 1. Music publication sources. {#table-1-music-publication-sources}

+-----------------+----------+----------+--------+---+
| **Publication** | **Review | **Album  | **Rev  | * |
|                 | Period** | Co       | iews** | * |
|                 |          | verage** |        | F |
|                 |          |          |        | o |
|                 |          |          |        | c |
|                 |          |          |        | u |
|                 |          |          |        | s |
|                 |          |          |        | * |
|                 |          |          |        | * |
+=================+==========+==========+========+===+
| 1\. *Pitchfork* | Aug      | 19       | 29,715 | A |
|                 | 1        | 59--2025 |        | l |
|                 | 996--Apr |          |        | t |
|                 | 2025     |          |        | e |
|                 |          |          |        | r |
|                 |          |          |        | n |
|                 |          |          |        | a |
|                 |          |          |        | t |
|                 |          |          |        | i |
|                 |          |          |        | v |
|                 |          |          |        | e |
|                 |          |          |        | , |
|                 |          |          |        | i |
|                 |          |          |        | n |
|                 |          |          |        | d |
|                 |          |          |        | i |
|                 |          |          |        | e |
|                 |          |          |        | , |
|                 |          |          |        | e |
|                 |          |          |        | x |
|                 |          |          |        | p |
|                 |          |          |        | e |
|                 |          |          |        | r |
|                 |          |          |        | i |
|                 |          |          |        | m |
|                 |          |          |        | e |
|                 |          |          |        | n |
|                 |          |          |        | t |
|                 |          |          |        | a |
|                 |          |          |        | l |
+-----------------+----------+----------+--------+---+
| 2\.             | Jan      | 20       | 11,978 | I |
| *Sputnikmusic*  | 2        | 05--2025 |        | n |
|                 | 005--Apr |          |        | d |
|                 | 2025     |          |        | i |
|                 |          |          |        | e |
|                 |          |          |        | , |
|                 |          |          |        | m |
|                 |          |          |        | e |
|                 |          |          |        | t |
|                 |          |          |        | a |
|                 |          |          |        | l |
|                 |          |          |        | , |
|                 |          |          |        | p |
|                 |          |          |        | u |
|                 |          |          |        | n |
|                 |          |          |        | k |
+-----------------+----------+----------+--------+---+
| 3\. *The        | 2        | 19       | 6,551  | D |
| Guardian*       | 000--Apr | 59--2025 |        | i |
|                 | 2025     |          |        | v |
|                 |          |          |        | e |
|                 |          |          |        | r |
|                 |          |          |        | s |
|                 |          |          |        | e |
|                 |          |          |        | g |
|                 |          |          |        | e |
|                 |          |          |        | n |
|                 |          |          |        | r |
|                 |          |          |        | e |
|                 |          |          |        | s |
|                 |          |          |        | , |
|                 |          |          |        | m |
|                 |          |          |        | a |
|                 |          |          |        | i |
|                 |          |          |        | n |
|                 |          |          |        | s |
|                 |          |          |        | t |
|                 |          |          |        | r |
|                 |          |          |        | e |
|                 |          |          |        | a |
|                 |          |          |        | m |
+-----------------+----------+----------+--------+---+
| 4\. *The        | Mar      | 20       | 4,961  | U |
| Quietus*        | 2        | 08--2025 |        | n |
|                 | 008--Apr |          |        | d |
|                 | 2025     |          |        | e |
|                 |          |          |        | r |
|                 |          |          |        | g |
|                 |          |          |        | r |
|                 |          |          |        | o |
|                 |          |          |        | u |
|                 |          |          |        | n |
|                 |          |          |        | d |
|                 |          |          |        | , |
|                 |          |          |        | a |
|                 |          |          |        | v |
|                 |          |          |        | a |
|                 |          |          |        | n |
|                 |          |          |        | t |
|                 |          |          |        | - |
|                 |          |          |        | g |
|                 |          |          |        | a |
|                 |          |          |        | r |
|                 |          |          |        | d |
|                 |          |          |        | e |
+-----------------+----------+----------+--------+---+
| 5\. NPR         | 2        | 20       | 4,118  | A |
|                 | 000--Apr | 00--2025 |        | l |
|                 | 2025     |          |        | l |
|                 |          |          |        | g |
|                 |          |          |        | e |
|                 |          |          |        | n |
|                 |          |          |        | r |
|                 |          |          |        | e |
|                 |          |          |        | s |
|                 |          |          |        | , |
|                 |          |          |        | p |
|                 |          |          |        | u |
|                 |          |          |        | b |
|                 |          |          |        | l |
|                 |          |          |        | i |
|                 |          |          |        | c |
|                 |          |          |        | r |
|                 |          |          |        | a |
|                 |          |          |        | d |
|                 |          |          |        | i |
|                 |          |          |        | o |
+-----------------+----------+----------+--------+---+
| 6\.             | Sep      | 20       | 3,619  | E |
| *G              | 2        | 21--2025 |        | u |
| ôutemesdisques* | 021--Apr |          |        | r |
|                 | 2025     |          |        | o |
|                 |          |          |        | p |
|                 |          |          |        | e |
|                 |          |          |        | a |
|                 |          |          |        | n |
|                 |          |          |        | e |
|                 |          |          |        | l |
|                 |          |          |        | e |
|                 |          |          |        | c |
|                 |          |          |        | t |
|                 |          |          |        | r |
|                 |          |          |        | o |
|                 |          |          |        | n |
|                 |          |          |        | i |
|                 |          |          |        | c |
|                 |          |          |        | , |
|                 |          |          |        | i |
|                 |          |          |        | n |
|                 |          |          |        | d |
|                 |          |          |        | i |
|                 |          |          |        | e |
+-----------------+----------+----------+--------+---+
| 7\. Pop Rescue  | Jul      | 19       | 244    | R |
|                 | 2        | 80--2009 |        | e |
|                 | 014--Apr |          |        | t |
|                 | 2025     |          |        | r |
|                 |          |          |        | o |
|                 |          |          |        | s |
|                 |          |          |        | p |
|                 |          |          |        | e |
|                 |          |          |        | c |
|                 |          |          |        | t |
|                 |          |          |        | i |
|                 |          |          |        | v |
|                 |          |          |        | e |
|                 |          |          |        | p |
|                 |          |          |        | o |
|                 |          |          |        | p |
+-----------------+----------+----------+--------+---+
| **Total**       |          |          | **61   |   |
|                 |          |          | ,186** |   |
+-----------------+----------+----------+--------+---+

Notable sources include *Pitchfork*, considered one of the most
influential music publications of recent decades [@n4gibusxmpo];
[@n37h9snme4b], known for verbose and stylized prose; *The Quietus*,
recognized for quality long-form writing on underground music; and NPR's
comprehensive coverage through programs like *All Songs Considered.*
This diverse corpus ensures broad representation across musical styles
and critical approaches.

## 3.2. Graph Construction {#graph-construction}

Following the methodology described in [Section 2](#methodology "null"),
we processed the review corpus to identify artist mentions and construct
the influence graph. For named entity recognition (NER), we employed
pretrained models from [@n7qedy9smug] version 3.7 and [@nzeldwhxqfz]
version 0.17.1 to verify that artist names appeared as proper nouns in
musical contexts.

The resulting graph contains:

-   22,831 nodes (unique artists)

-   159,389 edges (influence connections)

-   Average degree: 17.33 connections per artist

-   Graph density: 0.001[^1]

-   Connected components: 355 total

The largest connected component encompassed 14,479 nodes (63% of all
artists), while the remaining 354 components are small subgraphs of two
to three nodes. This structure demonstrates strong overall connectivity
while maintaining sparsity---desirable properties that minimize
dead-ends during traversal while preserving meaningful connections.
Graph analysis and visualization employed [@nwb5vo125ms] version 2.8.7.

## 3.3. Sonic Feature Extraction

We obtained sonic features for 151,646 songs corresponding to the top 10
tracks per artist, for those artists and songs for whom sonic features
were available, using the Spotify Web Application Programming Interface
(API) [@n9boi8v1ssq]. [Table
2](#table-2-sonic-features-spotify-application-programming-interface "null")
describes the 10 features used to characterize each artist's musical
style. For each of the 15,164 artists used, we computed the average
across their top songs and feature value for each sonic feature to
create a representative sonic profile.

#### Table 2. Sonic features (Spotify Application Programming Interface). {#table-2-sonic-features-spotify-application-programming-interface}

+------------------+---+
| **Feature**      | * |
|                  | * |
|                  | D |
|                  | e |
|                  | s |
|                  | c |
|                  | r |
|                  | i |
|                  | p |
|                  | t |
|                  | i |
|                  | o |
|                  | n |
|                  | * |
|                  | * |
+==================+===+
| 1\. Acousticness | C |
|                  | o |
|                  | n |
|                  | f |
|                  | i |
|                  | d |
|                  | e |
|                  | n |
|                  | c |
|                  | e |
|                  | m |
|                  | e |
|                  | a |
|                  | s |
|                  | u |
|                  | r |
|                  | e |
|                  | ( |
|                  | 0 |
|                  | - |
|                  | - |
|                  | 1 |
|                  | ) |
|                  | o |
|                  | f |
|                  | a |
|                  | c |
|                  | o |
|                  | u |
|                  | s |
|                  | t |
|                  | i |
|                  | c |
|                  | i |
|                  | n |
|                  | s |
|                  | t |
|                  | r |
|                  | u |
|                  | m |
|                  | e |
|                  | n |
|                  | t |
|                  | a |
|                  | t |
|                  | i |
|                  | o |
|                  | n |
+------------------+---+
| 2\. Danceability | S |
|                  | u |
|                  | i |
|                  | t |
|                  | a |
|                  | b |
|                  | i |
|                  | l |
|                  | i |
|                  | t |
|                  | y |
|                  | f |
|                  | o |
|                  | r |
|                  | d |
|                  | a |
|                  | n |
|                  | c |
|                  | i |
|                  | n |
|                  | g |
|                  | b |
|                  | a |
|                  | s |
|                  | e |
|                  | d |
|                  | o |
|                  | n |
|                  | t |
|                  | e |
|                  | m |
|                  | p |
|                  | o |
|                  | , |
|                  | r |
|                  | h |
|                  | y |
|                  | t |
|                  | h |
|                  | m |
|                  | , |
|                  | a |
|                  | n |
|                  | d |
|                  | b |
|                  | e |
|                  | a |
|                  | t |
|                  | ( |
|                  | 0 |
|                  | - |
|                  | - |
|                  | 1 |
|                  | ) |
+------------------+---+
| 3\. Energy       | P |
|                  | e |
|                  | r |
|                  | c |
|                  | e |
|                  | p |
|                  | t |
|                  | u |
|                  | a |
|                  | l |
|                  | m |
|                  | e |
|                  | a |
|                  | s |
|                  | u |
|                  | r |
|                  | e |
|                  | o |
|                  | f |
|                  | i |
|                  | n |
|                  | t |
|                  | e |
|                  | n |
|                  | s |
|                  | i |
|                  | t |
|                  | y |
|                  | a |
|                  | n |
|                  | d |
|                  | a |
|                  | c |
|                  | t |
|                  | i |
|                  | v |
|                  | i |
|                  | t |
|                  | y |
|                  | ( |
|                  | 0 |
|                  | - |
|                  | - |
|                  | 1 |
|                  | ) |
+------------------+---+
| 4\.              | L |
| Instrumentalness | i |
|                  | k |
|                  | e |
|                  | l |
|                  | i |
|                  | h |
|                  | o |
|                  | o |
|                  | d |
|                  | o |
|                  | f |
|                  | n |
|                  | o |
|                  | v |
|                  | o |
|                  | c |
|                  | a |
|                  | l |
|                  | c |
|                  | o |
|                  | n |
|                  | t |
|                  | e |
|                  | n |
|                  | t |
|                  | ( |
|                  | 0 |
|                  | - |
|                  | - |
|                  | 1 |
|                  | ) |
+------------------+---+
| 5\. Key          | M |
|                  | u |
|                  | s |
|                  | i |
|                  | c |
|                  | a |
|                  | l |
|                  | k |
|                  | e |
|                  | y |
|                  | u |
|                  | s |
|                  | i |
|                  | n |
|                  | g |
|                  | P |
|                  | i |
|                  | t |
|                  | c |
|                  | h |
|                  | C |
|                  | l |
|                  | a |
|                  | s |
|                  | s |
|                  | n |
|                  | o |
|                  | t |
|                  | a |
|                  | t |
|                  | i |
|                  | o |
|                  | n |
|                  | ( |
|                  | − |
|                  | 1 |
|                  | i |
|                  | f |
|                  | u |
|                  | n |
|                  | d |
|                  | e |
|                  | t |
|                  | e |
|                  | c |
|                  | t |
|                  | e |
|                  | d |
|                  | ) |
+------------------+---+
| 6\. Liveness     | P |
|                  | r |
|                  | o |
|                  | b |
|                  | a |
|                  | b |
|                  | i |
|                  | l |
|                  | i |
|                  | t |
|                  | y |
|                  | o |
|                  | f |
|                  | l |
|                  | i |
|                  | v |
|                  | e |
|                  | p |
|                  | e |
|                  | r |
|                  | f |
|                  | o |
|                  | r |
|                  | m |
|                  | a |
|                  | n |
|                  | c |
|                  | e |
|                  | ( |
|                  | 0 |
|                  | - |
|                  | - |
|                  | 1 |
|                  | ) |
+------------------+---+
| 7\. Loudness     | A |
|                  | v |
|                  | e |
|                  | r |
|                  | a |
|                  | g |
|                  | e |
|                  | l |
|                  | o |
|                  | u |
|                  | d |
|                  | n |
|                  | e |
|                  | s |
|                  | s |
|                  | i |
|                  | n |
|                  | d |
|                  | e |
|                  | c |
|                  | i |
|                  | b |
|                  | e |
|                  | l |
|                  | s |
|                  | ( |
|                  | t |
|                  | y |
|                  | p |
|                  | i |
|                  | c |
|                  | a |
|                  | l |
|                  | l |
|                  | y |
|                  | − |
|                  | 6 |
|                  | 0 |
|                  | t |
|                  | o |
|                  | 0 |
|                  | d |
|                  | B |
|                  | ) |
+------------------+---+
| 8\. Speechiness  | P |
|                  | r |
|                  | e |
|                  | s |
|                  | e |
|                  | n |
|                  | c |
|                  | e |
|                  | o |
|                  | f |
|                  | s |
|                  | p |
|                  | o |
|                  | k |
|                  | e |
|                  | n |
|                  | w |
|                  | o |
|                  | r |
|                  | d |
|                  | s |
|                  | ( |
|                  | 0 |
|                  | - |
|                  | - |
|                  | 1 |
|                  | ) |
+------------------+---+
| 9\. Tempo        | S |
|                  | p |
|                  | e |
|                  | e |
|                  | d |
|                  | i |
|                  | n |
|                  | b |
|                  | e |
|                  | a |
|                  | t |
|                  | s |
|                  | p |
|                  | e |
|                  | r |
|                  | m |
|                  | i |
|                  | n |
|                  | u |
|                  | t |
|                  | e |
+------------------+---+
| 10\. Valence     | M |
|                  | u |
|                  | s |
|                  | i |
|                  | c |
|                  | a |
|                  | l |
|                  | p |
|                  | o |
|                  | s |
|                  | i |
|                  | t |
|                  | i |
|                  | v |
|                  | e |
|                  | n |
|                  | e |
|                  | s |
|                  | s |
|                  | / |
|                  | m |
|                  | o |
|                  | o |
|                  | d |
|                  | ( |
|                  | 0 |
|                  | - |
|                  | - |
|                  | 1 |
|                  | ) |
+------------------+---+

These feature sets have been validated in previous music information
retrieval researches [@n74g1qpikog]; [@nkuaghk10ou] and provide a
comprehensive acoustic characterization of musical content.

## 3.4. Feature Weight Optimization

To derive empirically grounded weights for the sonic features (as
described in [Section 2.4](#music-selection-algorithms "null")), we
trained a single-layer perceptron on 15,270 artists to predict their
primary genre (60 categories) from their sonic profiles. The model was
trained on 11,452 artists (75%) and evaluated on 3,818 artists (25%),
achieving a One vs One (OvO) receiver operating characteristic area
under the curve (ROC-AUC) score of 0.69, sufficient for deriving
meaningful feature weights while confirming that sonic features carry
genre-discriminative information. While there are certainly more complex
(and probably better performing) predictive model specifications, the
focus of this work is not predicting genre in the most accurate way.
Rather, this step is merely instrumental to derive a sensible set of
weights for sonic features used elsewhere in the model. Importantly, the
single-layer architecture lets the resulting weights preserve a
straightforward feature importance interpretation.

[Table 3](#table-3-optimized-feature-weights "null") presents the
normalized feature weights used in calculating weighted Euclidean
distances between artists. Notably, speechiness (0.35) and loudness
(0.17) emerge as the most discriminative features for genre
classification, while danceability (0.01) contributes minimally. These
weights are applied in all sonic similarity calculations throughout the
recommendation algorithms. Implementation used [@n67im04az3a] version
1.5. Details on this step are provided in [Appendix
B](#appendix-b-using-music-genres-to-generate-sonic-feature-distance-weights "null").

#### Table 3. Optimized feature weights. {#table-3-optimized-feature-weights}

+-----------------+-----------+
| **Feature**     | *         |
|                 | *Weight** |
+=================+===========+
| Speechiness     | 0.35      |
+-----------------+-----------+
| Loudness        | 0.17      |
+-----------------+-----------+
| Tempo           | 0.12      |
+-----------------+-----------+
| Energy          | 0.092     |
+-----------------+-----------+
| Valence         | 0.07      |
+-----------------+-----------+
| Acousticness    | 0.06      |
+-----------------+-----------+
| Key             | 0.05      |
+-----------------+-----------+
| Lineness        | 0.04      |
+-----------------+-----------+
| I               | 0.03      |
| nstrumentalness |           |
+-----------------+-----------+
| Danceability    | 0.01      |
+-----------------+-----------+
| **Total**       | **1.00**  |
+-----------------+-----------+

## 3.5. Online Demonstration

An interactive web application implementing the complete framework is
publicly available at [stell-r.com](https://stell-r.com "null"). The
platform enables users to explore the artist network through various
traversal algorithms and visualize customizable subgraphs, demonstrating
the practical application of the proposed recommendation system.
Detailed computational complexity analysis and memory requirements for
all algorithms are provided in [Appendix
C](#appendix-c-algorithm-complexity-analysis "null").

## 3.6. Query Examples

To illustrate how the network can be interactively queried and
traversed, we present several representative examples of artist-based
recommendations as implemented on the aforementioned
[stell-r.com](https://stell-r.com "null") platform, and their
corresponding results ([Tables
4--5](#table-4-artist-recommendations-based-on-nirvana-n-12-via-breadth-first-search-traversal "null");
[Figures 1--2](#nvl6msx2lnv "null")). These reproducible examples
demonstrate how the traversal algorithms described in [Section
2.4](#music-selection-algorithms "null") translate into concrete,
interpretable outputs for end users.

[Table
4](#table-4-artist-recommendations-based-on-nirvana-n-12-via-breadth-first-search-traversal "null")
shows a BFS query starting from Nirvana, generating a 12-artist
recommendation list constrained by sonic similarity thresholds. The
resulting mix combines direct stylistic peers (e.g., Pearl Jam, Sonic
Youth, REM) with semantically proximate yet cross-genre connections
(e.g., Gaye Su Akyol, Florence and the Machine), exemplifying the
model's capacity to balance coherence with discovery. [Table
5](#table-5-shortest-paths-between-various-pairs-of-artists-in-the-implemented-graph-via-modified-dijkstra "null")
illustrates the shortest-path algorithm applied to selected artist
pairs, revealing plausible influence chains such as The Velvet
Underground → Cate Le Bon → St. Vincent → Taylor Swift or Kraftwerk →
Iggy Pop → Nine Inch Nails. These sequences make explicit the
directional interpretation of edges in the influence graph---each path
representing the minimal semantic distance (maximal inferred influence)
between the source and target artists. [Figure 1](#nvl6msx2lnv "null")
visualizes the subgraph obtained from a BFS traversal centered on Aphex
Twin ($N$ = 50). The visualizations highlight how densely connected
local neighborhoods emerge around stylistically influential nodes, with
peripheral artists reflecting secondary sonic associations captured
through the weighted mention-based edges. This figure concretely
demonstrates how a single-artist query yields a coherent yet exploratory
recommendation space anchored in review-derived relationships. [Figure
2](#n7xdzp43tjd "null") expands this logic to a multiartist query
centered jointly on David Bowie and Prince ($N$ = 60). Here, the
multiroot BFS identifies artists at the intersection of both influence
networks, effectively mapping a stylistic intersection between the two
artists.

Together, these query examples and visualizations illustrate the utility
of the proposed network-based recommendation process. They also provide
an intuitive bridge between the algorithmic framework outlined in
[Section 2](#methodology "null") and the quantitative validation that
will follow in [Section 4.1](#network-structure-validation "null"),
concretely showing how artist-centered graph traversal can emulate
expert-guided exploration within a rich, semantically grounded musical
space.

#### Table 4. Artist recommendations based on Nirvana ($N$ = 12, via breadth-first search traversal).  {#table-4-artist-recommendations-based-on-nirvana-n-12-via-breadth-first-search-traversal}

  1\. The Beatles                7\. Pearl Jam
  ------------------------------ ----------------------
  2\. Gaye Su Akyol              8\. Endless Nameless
  3\. Michael Jackson            9\. The Vaselines
  4\. Florence and the Machine   10\. Beat Happening
  5\. Sonic Youth                11\. Mariah Carey
  6\. REM                        12\. Pagoda

####  Table 5. Shortest paths between various pairs of artists in the implemented graph (via modified Dijkstra). {#table-5-shortest-paths-between-various-pairs-of-artists-in-the-implemented-graph-via-modified-dijkstra}

  1\. **The Velvet Underground** → Cate Le Bon → St. Vincent → **Taylor Swift**
  -------------------------------------------------------------------------------
  2\. **Kraftwerk** → Iggy Pop → **Nine inch Nails**
  3\. **Joni Mitchell** → Taylor Swift → Katy Perry → **Sabrina Carpenter**

![](https://assets.pubpub.org/hooxrnjo/aphex-51763587452039.png){#nvl6msx2lnv}

**Figure 1.** Subgraph centered on Aphex Twin (*N* = 50 via
breadth-first search traversal).

![](https://assets.pubpub.org/ftx7uanl/bowie-prince-41763587478735.png){#n7xdzp43tjd}

**Figure 2.** Subgraph centered at David Bowie and Prince (*N* = 60, via
multi-artist breadth-first search traversal).

# 4. Validation

We validate our network-based recommendation framework (hereon
'Stell-R') through two complementary approaches: (1) network structure
analysis demonstrating that our extracted influence graph captures
meaningful musical relationships, and (2) simulation studies evaluating
recommendation quality across diverse user profiles. Together, these
validations establish both the musicological validity of our approach
and its practical effectiveness for music discovery.

## 4.1. Network Structure Validation

The constructed influence graph of 22,831 artists and 159,389 edges
exhibited strong community structure and network properties consistent
with established musical taxonomies, providing empirical validation of
our methodology.

A brief clarification is warranted regarding the *Classical* community
(Community 8), in which *J. S. Bach* appears as the most influential
artist. For classical music, such nodes do not represent recording
artists but rather *composers* whose works are reviewed through
performances and interpretations by others. In the present
implementation, mentions of a composer's name within reviews of recorded
performances by contemporary artists (as opposed to the composer
themself) will directly lead to the composer being incorporated as a
node in the network. Accordingly, figures such as Bach, Mozart, or
Beethoven function as referential anchors that connect performers,
ensembles, and recordings associated with their repertoire. This
inclusion design choice, although imperfect, still captures underlying
semantic and historical relationships expressed in critical discourse,
though their interpretation differs from that of modern artists whose
nodes correspond to individuals or groups producing original recordings.

### 4.1.1. Community Detection and Musical Coherence

Community detection using the Leiden algorithm [@ndcgp0tfhut] identified
12 major artist communities ([Figure 3](#nnzkpm0imi6 "null")) with a
modularity score of $Q$ = 0.64, exceeding typical values (0.3--0.7)
found in social networks [@nw6018b38jr]. This high modularity indicates
well-defined community boundaries emerging naturally from the
review-based influence patterns, as we hypothesized.[^2]

Additional validation metrics further indicate strong musical coherence
within the identified communities. Specifically, 73% of the edges
connect artists belonging to the same community, reflecting a high
internal edge ratio. The average internal density of 0.045, while
seemingly low in absolute terms, is substantially higher than the
overall network density of approximately 0.00066 (computed from roughly
22,000 nodes and 159,000 edges). This contrast demonstrates that the
communities are considerably more densely connected internally than the
network as a whole, indicating well-connected and cohesive groups.
Furthermore, the degree distribution of the network follows a power law
with an exponent $\alpha$ = 2.1, consistent with patterns observed in
cultural networks. The network also exhibits small-world properties, as
evidenced by a high small-world ratio $\sigma$ = 168, which arises from
a relatively short average path length $L$ = 3.2 combined with a
moderate clustering coefficient $C$ = 0.18. These features indicate that
while the network is highly clustered, any two artists are separated by
only a few steps, facilitating algorithmic traversal across communities.

The detected communities align precisely with recognized musical genres
without any genre labels as input, as shown in [Figure
3](#nnzkpm0imi6 "null") and [Table
6](#table-6-community-structure-with-size-top-influencer-and-genre "null").

#### Table 6. Community structure with size, top influencer, and genre. {#table-6-community-structure-with-size-top-influencer-and-genre}

+-----------+-----+-------------------+---+
| **        | **  | **Top Community   | * |
| Community | Siz | Artist**          | * |
| No.**     | e** |                   | G |
|           |     |                   | e |
|           |     |                   | n |
|           |     |                   | r |
|           |     |                   | e |
|           |     |                   | / |
|           |     |                   | S |
|           |     |                   | t |
|           |     |                   | y |
|           |     |                   | l |
|           |     |                   | e |
|           |     |                   | * |
|           |     |                   | * |
+===========+=====+===================+===+
| 0         | 3,  | Black Sabbath     | M |
|           | 433 |                   | e |
|           |     |                   | t |
|           |     |                   | a |
|           |     |                   | l |
|           |     |                   | ; |
|           |     |                   | P |
|           |     |                   | r |
|           |     |                   | o |
|           |     |                   | g |
|           |     |                   | r |
|           |     |                   | e |
|           |     |                   | s |
|           |     |                   | s |
|           |     |                   | i |
|           |     |                   | v |
|           |     |                   | e |
|           |     |                   | R |
|           |     |                   | o |
|           |     |                   | c |
|           |     |                   | k |
+-----------+-----+-------------------+---+
| 1         | 2,  | Brian Eno         | A |
|           | 922 |                   | m |
|           |     |                   | b |
|           |     |                   | i |
|           |     |                   | e |
|           |     |                   | n |
|           |     |                   | t |
|           |     |                   | ; |
|           |     |                   | E |
|           |     |                   | x |
|           |     |                   | p |
|           |     |                   | e |
|           |     |                   | r |
|           |     |                   | i |
|           |     |                   | m |
|           |     |                   | e |
|           |     |                   | n |
|           |     |                   | t |
|           |     |                   | a |
|           |     |                   | l |
|           |     |                   | E |
|           |     |                   | l |
|           |     |                   | e |
|           |     |                   | c |
|           |     |                   | t |
|           |     |                   | r |
|           |     |                   | o |
|           |     |                   | n |
|           |     |                   | i |
|           |     |                   | c |
+-----------+-----+-------------------+---+
| 2         | 2,  | Bob Dylan         | F |
|           | 442 |                   | o |
|           |     |                   | l |
|           |     |                   | k |
|           |     |                   | ; |
|           |     |                   | S |
|           |     |                   | i |
|           |     |                   | n |
|           |     |                   | g |
|           |     |                   | e |
|           |     |                   | r |
|           |     |                   | - |
|           |     |                   | S |
|           |     |                   | o |
|           |     |                   | n |
|           |     |                   | g |
|           |     |                   | w |
|           |     |                   | r |
|           |     |                   | i |
|           |     |                   | t |
|           |     |                   | e |
|           |     |                   | r |
+-----------+-----+-------------------+---+
| 3         | 2,  | Kanye West        | H |
|           | 353 |                   | i |
|           |     |                   | p |
|           |     |                   | - |
|           |     |                   | H |
|           |     |                   | o |
|           |     |                   | p |
|           |     |                   | ; |
|           |     |                   | R |
|           |     |                   | a |
|           |     |                   | p |
+-----------+-----+-------------------+---+
| 4         | 2,  | Sonic Youth       | E |
|           | 190 |                   | x |
|           |     |                   | p |
|           |     |                   | e |
|           |     |                   | r |
|           |     |                   | i |
|           |     |                   | m |
|           |     |                   | e |
|           |     |                   | n |
|           |     |                   | t |
|           |     |                   | a |
|           |     |                   | l |
|           |     |                   | R |
|           |     |                   | o |
|           |     |                   | c |
|           |     |                   | k |
|           |     |                   | ; |
|           |     |                   | N |
|           |     |                   | o |
|           |     |                   | i |
|           |     |                   | s |
|           |     |                   | e |
+-----------+-----+-------------------+---+
| 5         | 2,  | Arcade Fire       | I |
|           | 167 |                   | n |
|           |     |                   | d |
|           |     |                   | i |
|           |     |                   | e |
|           |     |                   | ; |
|           |     |                   | A |
|           |     |                   | l |
|           |     |                   | t |
|           |     |                   | e |
|           |     |                   | r |
|           |     |                   | n |
|           |     |                   | a |
|           |     |                   | t |
|           |     |                   | i |
|           |     |                   | v |
|           |     |                   | e |
|           |     |                   | R |
|           |     |                   | o |
|           |     |                   | c |
|           |     |                   | k |
+-----------+-----+-------------------+---+
| 6         | 1,  | Taylor Swift      | C |
|           | 953 |                   | o |
|           |     |                   | n |
|           |     |                   | t |
|           |     |                   | e |
|           |     |                   | m |
|           |     |                   | p |
|           |     |                   | o |
|           |     |                   | r |
|           |     |                   | a |
|           |     |                   | r |
|           |     |                   | y |
|           |     |                   | P |
|           |     |                   | o |
|           |     |                   | p |
+-----------+-----+-------------------+---+
| 7         | 1,  | Miles Davis       | J |
|           | 321 |                   | a |
|           |     |                   | z |
|           |     |                   | z |
+-----------+-----+-------------------+---+
| 8         | 1,  | Bach              | C |
|           | 217 |                   | l |
|           |     |                   | a |
|           |     |                   | s |
|           |     |                   | s |
|           |     |                   | i |
|           |     |                   | c |
|           |     |                   | a |
|           |     |                   | l |
+-----------+-----+-------------------+---+
| 9         | 393 | My Bloody         | I |
|           |     | Valentine         | n |
|           |     |                   | d |
|           |     |                   | i |
|           |     |                   | e |
|           |     |                   | ; |
|           |     |                   | D |
|           |     |                   | r |
|           |     |                   | e |
|           |     |                   | a |
|           |     |                   | m |
|           |     |                   | P |
|           |     |                   | o |
|           |     |                   | p |
+-----------+-----+-------------------+---+
| 10        | 362 | David Bowie       | A |
|           |     |                   | r |
|           |     |                   | t |
|           |     |                   | P |
|           |     |                   | o |
|           |     |                   | p |
|           |     |                   | ; |
|           |     |                   | A |
|           |     |                   | r |
|           |     |                   | t |
|           |     |                   | R |
|           |     |                   | o |
|           |     |                   | c |
|           |     |                   | k |
+-----------+-----+-------------------+---+
| 11        | 175 | Anticon et al     | M |
|           |     |                   | i |
|           |     |                   | s |
|           |     |                   | c |
|           |     |                   | e |
|           |     |                   | l |
|           |     |                   | l |
|           |     |                   | a |
|           |     |                   | n |
|           |     |                   | e |
|           |     |                   | o |
|           |     |                   | u |
|           |     |                   | s |
+-----------+-----+-------------------+---+

### 4.1.2. Hierarchical Subcommunity Structure

Recursive application of community detection further revealed nested
subcommunities within each major community, capturing fine-grained
stylistic distinctions. For instance, within Metal/Progressive
(Community 0), 37 subcommunities were detected, including a Linkin Park
subcommunity of 155 artists. Within Ambient; Experimental Electronic
(Community 1), 31 subcommunities were found, including a Ricardo
Villalobos-led circle (121 artists). Within Folk (Community 2), 38
subcommunities were found, including one led by Nick Drake (106
artists), and a 91-artist one led by Fleet Foxes, a more contemporary
folk band. Once again, the network structure seems to broadly align with
taxonomic complexities of musical genres, exogenous to our network,
recognizable not only by critics and musicologists, but by more casual
audiences.[^3]

### 4.1.3. Bridge Artists and Cross-Genre Connectivity

Artists with highest intercommunity connectivity correspond to musicians
historically recognized for genre-crossing influence (or 'bridge'
artists). Notably, we identified David Bowie as the top bridge artist in
our review-based network, with 442 external connections spanning
multiple communities. Bowie's career trajectory from glam rock through
soul, electronic, and industrial phases represents perhaps the most
celebrated example of sustained genre-crossing influence in popular
music history. That our algorithm identifies him as the network's
primary connector, purely from review text analysis, strongly validates
our methodology's ability to capture meaningful musical influence
patterns. Similarly, the prominence of Brian Eno (361 external
connections) as a bridge artist reflects his well-known role as both an
ambient music pioneer and a prolific producer for artists across rock,
pop, and experimental genres ([Table
7](#table-7-top-bridge-artists-by-intercommunity-connections "null")).
Betweenness centrality analysis[^4] confirms these artists occupy
critical structural positions (correlation with external connections:
$r = 0.847,$ $p < 0.001$).

#### Table 7. Top bridge artists by intercommunity connections. {#table-7-top-bridge-artists-by-intercommunity-connections}

+-----------------+---------------------+---+
| **Artist**      | **External          | * |
|                 | Connections**       | * |
|                 |                     | P |
|                 |                     | r |
|                 |                     | i |
|                 |                     | m |
|                 |                     | a |
|                 |                     | r |
|                 |                     | y |
|                 |                     | C |
|                 |                     | o |
|                 |                     | m |
|                 |                     | m |
|                 |                     | u |
|                 |                     | n |
|                 |                     | i |
|                 |                     | t |
|                 |                     | y |
|                 |                     | * |
|                 |                     | * |
+=================+=====================+===+
| David Bowie     | 442                 | E |
|                 |                     | l |
|                 |                     | e |
|                 |                     | c |
|                 |                     | t |
|                 |                     | r |
|                 |                     | o |
|                 |                     | n |
|                 |                     | i |
|                 |                     | c |
|                 |                     | / |
|                 |                     | N |
|                 |                     | e |
|                 |                     | w |
|                 |                     | W |
|                 |                     | a |
|                 |                     | v |
|                 |                     | e |
+-----------------+---------------------+---+
| Sonic Youth     | 398                 | E |
|                 |                     | x |
|                 |                     | p |
|                 |                     | e |
|                 |                     | r |
|                 |                     | i |
|                 |                     | m |
|                 |                     | e |
|                 |                     | n |
|                 |                     | t |
|                 |                     | a |
|                 |                     | l |
|                 |                     | / |
|                 |                     | N |
|                 |                     | o |
|                 |                     | i |
|                 |                     | s |
|                 |                     | e |
+-----------------+---------------------+---+
| Pink Floyd      | 397                 | M |
|                 |                     | e |
|                 |                     | t |
|                 |                     | a |
|                 |                     | l |
|                 |                     | / |
|                 |                     | P |
|                 |                     | r |
|                 |                     | o |
|                 |                     | g |
|                 |                     | r |
|                 |                     | e |
|                 |                     | s |
|                 |                     | s |
|                 |                     | i |
|                 |                     | v |
|                 |                     | e |
+-----------------+---------------------+---+
| Brian Eno       | 360                 | E |
|                 |                     | l |
|                 |                     | e |
|                 |                     | c |
|                 |                     | t |
|                 |                     | r |
|                 |                     | o |
|                 |                     | n |
|                 |                     | i |
|                 |                     | c |
|                 |                     | / |
|                 |                     | E |
|                 |                     | x |
|                 |                     | p |
|                 |                     | e |
|                 |                     | r |
|                 |                     | i |
|                 |                     | m |
|                 |                     | e |
|                 |                     | n |
|                 |                     | t |
|                 |                     | a |
|                 |                     | l |
+-----------------+---------------------+---+
| Animal          | 293                 | I |
| Collective      |                     | n |
|                 |                     | d |
|                 |                     | i |
|                 |                     | e |
|                 |                     | / |
|                 |                     | D |
|                 |                     | r |
|                 |                     | e |
|                 |                     | a |
|                 |                     | m |
|                 |                     | P |
|                 |                     | o |
|                 |                     | p |
+-----------------+---------------------+---+
| Daft Punk       | 293                 | E |
|                 |                     | l |
|                 |                     | e |
|                 |                     | c |
|                 |                     | t |
|                 |                     | r |
|                 |                     | o |
|                 |                     | n |
|                 |                     | i |
|                 |                     | c |
|                 |                     | / |
|                 |                     | N |
|                 |                     | e |
|                 |                     | w |
|                 |                     | W |
|                 |                     | a |
|                 |                     | v |
|                 |                     | e |
+-----------------+---------------------+---+
| Bob Dylan       | 287                 | F |
|                 |                     | o |
|                 |                     | l |
|                 |                     | k |
|                 |                     | / |
|                 |                     | S |
|                 |                     | i |
|                 |                     | n |
|                 |                     | g |
|                 |                     | e |
|                 |                     | r |
|                 |                     | - |
|                 |                     | S |
|                 |                     | o |
|                 |                     | n |
|                 |                     | g |
|                 |                     | w |
|                 |                     | r |
|                 |                     | i |
|                 |                     | t |
|                 |                     | e |
|                 |                     | r |
+-----------------+---------------------+---+

![](https://assets.pubpub.org/d18eyshk/music_communities-11763588669153.png){#nnzkpm0imi6}

**Figure 3.** **Network Community visualization showing distinct
color-coded musical communities annotated with representative artists.**
Node sizes are proportional to each artist's influence score within
their respective community. Larger nodes indicate artists with higher
centrality scores. Thicker edges represent stronger influence
relationships (i.e., higher edge weights from our review-based
extraction method) between the artists represented in the figure.

## 4.2. User Simulation Validation

To evaluate recommendation quality under controlled conditions, we
conducted simulation studies comparing our network-based approach
against established baselines. This methodology enables systematic
assessment across diverse user profiles while avoiding confounding
factors inherent in early-stage platform data. As explained below, while
the users are statistically simulated, the artist network and set of
artist-level sonic features used in the simulations correspond to the
22,000 artist real-world implementation and their respective 10 sonic
features described in previous sections. All three algorithms used the
same set of real-world artists and sonic features.

### 4.2.1. Simulation Design

We simulated 500 users, all identical except for their individual
profile in terms of 'openness,' which in psychological research has been
conceptualized as one of the 'Big Five' personality traits. These are:
(1) Extraversion; (2) Agreeableness; (3) Conscientiousness; (4)
Neuroticism; and (5) Openness to Experience (or simply Openness),
defined as "the tendency to be intellectually curious, creative, and
open to feelings" [@njepss2e9z8]. These---particularly openness---have
been shown to correlate with musical preferences and attitudes toward
music discovery [@nmj4njbzxc1]. We assume this five-trait personality
profile follows a multivariate normal distribution, with empirically
derived correlations following [@n3vbx6kcikg].

During the simulation, each user receives 20 artist recommendations per
session across 20 sequential sessions from each of three different
algorithms:

-   **Stell-R**: The BFS traversal with sonic similarity constraints
    proposed in [Section
    2.4.1](#k-length-bfs-traversal-with-sonic-similarity-filtering "null").

-   **Collaborative Filtering (CF):** Artist recommendations for each
    user are based on: 1) their similarity matrix to an external 2,000
    set of synthetic users with predefined simulated genre preferences
    and listening histories; 2) dynamic genre constraints, consistent
    with streaming platform model practices.

-   **Content-Based (CB): **Artist recommendations are derived solely
    from: 1) audio similarity pairwise distances between all artists in
    the catalog using available sonic features; 2) dynamic genre
    constraints, consistent with streaming platform model practices.

### 4.2.2. Satisfaction Score Calculation

Satisfaction scores were calculated for each of the 500 users after each
of their 20 artist-recommendation sessions, for each of the three
different algorithms. The satisfaction score calculation was done at the
session level and consisted of a dynamic weighted sum of three primary
components computed for the 20-artist mix received after each
recommendation session. The first component captures the
novelty-familiarity balance, measuring the proportion of recommended
artists not previously encountered by the user at that point of the
20-session path, with the interpretation of this metric conditional on
the user's openness trait---high openness users are modeled to derive
satisfaction from novelty, while low openness users are modeled to
derive satisfaction from familiarity. The second component measures
recommendation diversity through both genre variety and sonic style
heterogeneity based on audio features, with satisfaction response curves
that vary by openness level. The third component provides a quality
baseline derived using average popularity of recommended artist as a
proxy, serving as a personality-independent factor. The relative weights
assigned to these three components are dynamically adjusted based on
each user's openness score, implementing the hypothesis that personality
traits moderate the importance of different recommendation
characteristics. For users with high openness (\>0.6), weights were 40%
novelty, 40% diversity, and 20% quality; for medium openness (0.4--0.6),
weights were 30% novelty, 30% diversity, and 40% quality; and for low
openness (\<0.4), weights were 25% novelty, 25% diversity, and 50%
quality. Final satisfaction scores are transformed to a 1--5 scale with
added Gaussian noise (σ = 0.05) to simulate realistic rating
variability.

### 4.2.3. Performance Results

The simulation demonstrates competitive performance for our
network-based approach, with particularly strong results among
exploration-oriented users (Figures 4A--C).

Across all user types and sessions, average user satisfaction was 3.71
for content-based recommendations, 3.22 for collaborative filtering, and
3.21 for Stell-R. Overall, content-based recommendations were
statistically higher than the other two approaches ($p$ \< 0.001), while
Stell-R and collaborative filtering did not differ significantly between
them ($p$ \> 0.05). However, among high-openness users (arguably the
main user target population for our proposed framework), Stell-R
achieved 3.84 satisfaction vs. 3.75 for CF ($p$ \< 0.001) and its gap
against CB was considerably reduced. Notably, Stell-R yielded
significantly more cross-genre (i.e., 'bridge') artists across all user
types, and consistently greater cumulative new artist exposure, growing
throughout sessions, for all users types.

Overall, the simulation exercise preliminarily validates our approach's
effectiveness in terms of its intended metrics. First, Stell-R achieves
satisfaction statistically equivalent to collaborative filtering without
requiring user-item interaction data and with sub-50ms response times
for typical queries (vs. growing complexity of CF with user base).
High-openness users in particular experience significantly better
satisfaction with network-based recommendations through exposure to a
more diverse artist collection, prompted by a substantially higher
proportion of bridge artists, which naturally facilitates cross-genre
musical exploration.

![](https://assets.pubpub.org/ypqanlry/combined_fig_newUserSatisfaction-01763589573450.png){#neeuc4hewjf}

**Figure 4A**. User satisfaction by algorithm and user openness.

![](https://assets.pubpub.org/uskqe6xf/combined_fig_newReccDiversity-11763589611070.png){#nurgoyy0c4b}

**Figure 4B**. New artists by algorithm and user openness.

![](https://assets.pubpub.org/87jrjiht/combined_fig_newBridgeArtists-71763589653506.png){#n028fq3p3px}

**Figure 4C**. Number of bridge per session artists by algorithm and
user openness.

These results provide preliminary evidence that network-based
recommendation systems can match traditional approaches while offering
unique discovery capabilities, particularly for users seeking musical
boundary traversal and expert-guided exploration.

# 5. Discussion

## 5.1. Conclusion

Given the increasingly relevant role of online recommendation systems in
people's lives and the wide room for improvement for frameworks
currently in place, particularly within the MRS context, this work
leverages the availability of high-quality music criticism to introduce
a novel music recommendation system purely based on the detection of
influence paths between artists. By design, this framework lacks some of
the problems other systems naturally exhibit, and can be used to build
data structures that readily produce item-centered music recommendations
without the need for user data, which comes with potential computational
and social cost reductions, and holds promise for improved user
experiences in the long term.

The main technical innovations of the recommendation system here
proposed stem from the information retrieval process used to construct
the network and the graph-theoretic methodology developed to produce
recommendations. We programmatically leverage a currently underexplored
yet vast and continuously growing amount of written content by qualified
musical writers. Provided adequate: 1) data sources (i.e., comprehensive
and high-quality publications); 2) data processing (e.g., careful text
preprocessing and checks in the adjacency matrix construction); 3)
sensible path-searching algorithms (the connections drawn between
artists can be meaningful---having the more 'causal' interpretation of
'influence,' rather than mere associations). While it is expected that
pairwise relationships between artists be partially and broadly
determined by variables such as historical period, geographical region,
and genre, the complex reality of musical history is not fully grasped
by them. This methodological approach is promising in terms of user
experience, since it is not only focused on producing predictable music
recommendations but it is thought and built to allow and encourage music
exploration and to expand users' musical horizons (as opposed to
inertially constraining them). To the best of our knowledge, an
artist-centered approach like this has not been used for generating
music recommendations before.

Importantly, this approach, being exclusively focused on musical
factors, does not need users' data to be collected at all to function
effectively. This has positive social and ethical implications
concerning data privacy. In addition, for the platform, the
computational costs of maintaining and deploying the model are
considerably lower, since they require data volumes and processing
orders of magnitude lower than traditional predictive recommendation
models to function effectively; further, administrative costs related to
user data privacy are much lower, and the engagement of the users can be
higher in the long run. The model considers the artist (as opposed to
the platform user) the unit of analysis and recognizes their mutual
topological and sonic connections as crucial in guiding music discovery
processes. This, in turn, motivates a graph-based approach that allows
the development and application of innovative graph algorithms to select
music and produce recommendations based on such relationships. Further,
through its flexibility, the model naturally allows and encourages the
user to easily explore and learn about music as part of the process of
obtaining recommendations based on any desired starting point (e.g., one
or more artists of interest), as opposed to a more passive role where
they are, for instance, simply given an externally ready-made product
(e.g., playlist), allowing for more agency and personalization.

Further, to the extent that the proposed algorithms are built on data
extracted from diverse and trustworthy texts and rigorously
preprocessed, the resulting musical paths can have a more meaningful
interpretation of *artistic influence*, which may both: 1) satisfy user
needs not currently addressed by other platforms relying on UII-based
optimization mechanisms; 2) inform future research at the intersection
of musicology and computational methods.

The main benefits we expected from the recommendation system align with
the ones suggested by the simulation, namely: increased long-term user
satisfaction, especially among users with more complex listening habits
or preferences, a more balanced exposure for musical artists from all
commercial and cultural musical backgrounds, reduced privacy risks for
platform users, and lower computational costs for platforms. While
rigorous empirical validation requires a prospective and adequately
powered experimental design comparing Stell-R performance against that
of different recommendation platforms, which we leave as an exciting
avenue for future research, our preliminary findings provide evidence
for both the musicological validity and practical viability of our
approach: 1) network community analysis reveals remarkable
correspondence between algorithmically identified communities and
established musicological structure (modularity = 0.847), correctly
identifying seminal bridge artists such as David Bowie and Sonic Youth;
2) simulation-based evaluation demonstrates that Stell-R achieves user
satisfaction statistically equivalent to collaborative filtering while
significantly outperforming collaborative filtering among high-openness
users ($p$ \< 0.001) and providing superior bridge-artist discovery
capabilities across all user types. While content-based recommendations
achieved the highest overall satisfaction, the equivalence between
Stell-R and collaborative filtering, combined with unique bridge
discovery capabilities, suggests complementary rather than competitive
relationships between different recommendation approaches.

Beyond its specific contributions to music recommendation, this work
demonstrates a fundamental alternative to the machine learning orthodoxy
that has come to dominate recommendation system design. Rather than
training algorithms to predict and perpetuate user behavior patterns
through short-term engagement (e.g., likes and plays) optimization, our
approach leverages structured human knowledge---in this case, expert
music criticism---to create recommendation pathways that prioritize
discovery over consumption. This knowledge-based approach offers several
critical advantages over purely machine learning approaches: it
maintains transparency and interpretability, reduces dependence on user
data collection, eliminates the need for constant retraining, and most
importantly, optimizes for long-term user enrichment rather than
short-term engagement metrics.

The simulation results provide evidence that network-based
recommendations achieve competitive satisfaction levels while offering
unique capabilities for musical boundary traversal, particularly
benefiting users with high openness to experience who value musical
exploration and discovery. This finding challenges the fundamental
assumption underlying current recommendation system design: that
optimizing for predicted user engagement necessarily optimizes for user
satisfaction. Our results suggest that different recommendation
approaches serve different user needs---content-based methods excel at
immediate satisfaction, collaborative filtering effectively matches
established preferences, while network-based discovery provides unique
pathways for musical exploration and horizon expansion.

This paradigm shift has broader implications for how we conceptualize
the role of recommendation systems in cultural consumption. Rather than
serving as sophisticated prediction engines that amplify existing
preferences, recommendation systems can function as knowledge
transmission mechanisms that connect users with expert understanding of
cultural relationships. In the context of music, this means moving
beyond the question, 'What will this user click on next?' toward 'What
musical territories might enrich this user's understanding and
appreciation?' This reframing transforms recommendation systems from
mere tools for algorithmic engagement optimization into instruments of
cultural discovery and education.

These findings suggest that optimal recommendation systems may integrate
multiple approaches: content-based methods for immediate satisfaction,
collaborative filtering for preference matching, and network-based
discovery for musical exploration. Rather than replacing existing
methods, our approach offers a complementary pathway that prioritizes
long-term musical development over short-term engagement optimization.
Future research should focus on hybrid systems that combine the
satisfaction optimization of content-based approaches with the unique
bridge discovery capabilities of network-based methods, potentially
delivering both immediate user satisfaction and long-term musical
enrichment while addressing the fundamental limitations of each
individual approach.

## 5.2. Limitations

Methodologically, the main limitation of this model stems from the
combination of, one the one hand, its high dependency on the accuracy,
availability, comprehensiveness, and diversity of the corpus of musical
texts used for constructing the graph, and on the other hand, its high
sensitivity to the extraction of spurious relationships between artists,
which can certainly infiltrate from lower quality texts or not
sufficiently accurate criteria in the edge construction process of the
graph. It is thus a challenging task to strike a balance and ensure a
comprehensive artist and album inclusion by expanding the set of reviews
used in the construction of the graph while, crucially, maintaining high
accuracy and publication quality. In this initial implementation of the
model, we lean toward avoiding false positives in the selection of music
publications, while opting to avoid false negatives with a principled
rule-based string detection approach and traditional natural language
processing (NLP) techniques (as opposed, for instance, to more
sophisticated probabilistic approaches). Even with its apparent
simplicity, we show that the methodology is highly efficacious. Still,
future work can certainly improve on this trade-off and tackle the
complex task of detecting more nuanced influence relationships more
directly.

Additionally, our approach (at least in its current implementation)
faces three systematic biases inherent to the music journalism
landscape. First, *language bias* significantly constrains our
framework, as the current implementation (mostly because of its
availability and scope) overrelies on English-language publications.
This limitation systematically underrepresents musical traditions,
artists, and influence patterns from non-English-speaking musical
cultures, potentially creating an Anglo-centric view of musical
influence networks that may not reflect the true global diversity of
artistic connections. Second, *temporal bias* emerges from the heavy
concentration of music journalism on contemporary releases, resulting in
overrepresentation of post-1960s English-speaking and Western European
musical artists in our network. Historical artists and musical
traditions that predate the era of systematic music criticism are
consequently underweighted in influence calculations, despite their
fundamental importance to musical development. Third, *genre bias*
reflects the uneven coverage and publication patterns of music
journalism itself, where certain genres and geographies may receive
disproportionate critical attention compared to others (such as
mainstream pop, country, or world music), leading to systematic over-
and underrepresentation of different musical communities within our
influence network.

Beyond these methodological challenges, our validation approach faces
fundamental limitations inherent to recommendation system evaluation
that extend beyond the current implementation. The measurement of true
user satisfaction remains a persistent challenge in recommendation
system research, as users do not consistently report their genuine
satisfaction levels, leading to high missingness and potential bias in
satisfaction ratings even with adequate platform usage data. Our
simulation-based evaluation addresses this limitation by modeling
satisfaction determinants, but real-world validation would require
sophisticated longitudinal studies to capture authentic user experiences
beyond immediate explicit behavioral responses. Furthermore, our
simulation-based comparison assumes equivalent platform quality across
recommendation approaches---including user interface design, ease of
use, platform responsiveness, and overall user experience---factors that
significantly influence user satisfaction independent of recommendation
algorithm performance. In practice, the success of any recommendation
system depends heavily on implementation quality, interface design, and
platform usability. Real-world experimental designs comparing our
network-based approach against established platforms would need to
account for these confounding factors, requiring either controlled
platform environments or sophisticated statistical techniques to isolate
algorithmic effects from platform-specific user experience elements.
These evaluation challenges highlight the broader difficulty of
conducting fair algorithmic comparisons in recommendation system
research more generally, where user satisfaction emerges from the
complex interaction of content quality, interface design, and individual
user characteristics rather than algorithmic performance alone. While
our preliminary simulation provides theoretical evidence for the
viability of network-based approaches, definitive evaluation requires
carefully designed experimental frameworks that control for
non-algorithmic factors while capturing genuine long-term user
satisfaction rather than immediate engagement metrics. One
last---perhaps not so obvious---important limitation stems (as is often
the case for data science in social contexts) from Goodhart's Law
[@nxmptfhh2pw] according to which, were this type of framework to become
relatively prevalent, the way music reviews from authoritative sources
are written could change in ways that could potentially undermine their
signal, in terms of the ability to uncover meaningful musical
relationships between artists (e.g., influence).

## 5.3. Future Work

This work introduced a novel framework for music selection and
recommendation, as well as a basic implementation based on a limited set
of data sources. There are numerous exciting ways in which this work
could be improved, both in its methodology and on its current
implementation, even on top of tackling its aforementioned main
limitations. In terms of methodology, there are at least three avenues
for future improvements. First, including additional and more
sophisticated graph-theoretic tools, both to more formally study
properties of the embedded knowledge graph (such as spectral clustering
methods for community detection) and to find new types of paths between
artists, would set forth promising avenues for research and potentially
improve the quality of the recommendations. Second, incorporating better
methodologies (as well as richer data) into the computation of sonic
similarities between artists, such as distinct feature importance
measures to extract weights, and notions of sonic similarity other than
weighted Euclidean (for instance, the absolute moments metric or joint
Wasserstein distance matching) could potentially yield stronger links
between artists.

Third, augmenting the artist-specific attributes used to infer the
strength and type of relationships between artists, though we strongly
discourage the explicit use of geography, genre, and time, since they
are not musical properties but second-order correlates of similarity
between artists and are already partially accounted for by the
information embedded in expert music reviews.

In terms of implementation and validation, three critical areas require
immediate attention to advance this framework toward production-ready
deployment. First, rigorous real-world evaluation through controlled A/B
testing with actual users represents the most pressing need for
validating our simulation-based findings. While we provide sound
musicological validation of the network properties emerging from a
real-world implementation of our approach, along with some
simulation-based results showing a relatively higher performance of our
proposed method versus UII-based ones (especially among high-openness
users and over longer term horizons), a rigorous experimental evaluation
in real-world scenarios remains an important next step. Such an
evaluation would involve deploying the Stell-R framework alongside
existing recommendation systems in live environments, allowing for
direct comparison of user engagement metrics, satisfaction scores, and
long-term retention patterns across different user demographics and
musical preferences. This empirical validation is essential for
confirming whether the performance advantages demonstrated in our
simulation translate to genuine improvements in user experience under
real-world conditions. Second, developing robust mechanisms for dynamic
network updates poses a significant technical challenge that must be
addressed for practical deployment. As new artists emerge, albums are
released, and reviews are published, the influence network must be
updated efficiently without requiring complete reconstruction,
necessitating the development of incremental graph update algorithms
that can incorporate new nodes and edges while maintaining network
integrity and recalculating influence scores in real time. Third,
multilingual expansion represents a fundamental requirement for
addressing the language bias identified in our limitations analysis.
This expansion would involve incorporating non-English music criticism
from diverse cultural contexts, requiring sophisticated cross-language
entity recognition, translation methodologies that preserve musical
terminology nuances, and cultural adaptation of influence interpretation
frameworks to account for different critical traditions and artistic
evaluation criteria across linguistic and cultural boundaries.

In terms of implementation, exploring more sophisticated approaches to
tackle the trade-off between allowing for a more comprehensive inclusion
criteria for music publications without sacrificing the network quality
is an exciting and promising next step. Finally, the framework we
propose, although novel and promising, has yet to be evaluated in
real-world settings. The current validation relies primarily on
community structure analysis, musicological assessment, and simulations.

------------------------------------------------------------------------

# Acknowledgments

For their invaluable support, insights, and feedback, I would like to
thank friends and colleagues from: The University of Chicago,
particularly Donald Hedeker, Kaitlin Seibert, and Eric Polley; former
and current members of The Stuart Lab at the Johns Hopkins Bloomberg
School of Public Health; The True Vine Record Shop, particularly Jason
Willett and Steven Johnson.

# Disclosure Statement

The author has no financial or nonfinancial disclosures to share for
this article.

------------------------------------------------------------------------

# Data and Software

All the data and code used in the Implementation and Validation sections
is available from the author upon reasonable request.

------------------------------------------------------------------------

# References

Allen, J. (2024, June 26). Martha Skye Murphy: Um. *The Quietus*.
<https://thequietus.com/quietus-reviews/martha-skye-murphy-um-review/>

Álvarez, P., García de Quirós, J., & Baldassarri, S. (2023). RIADA: A
machine-learning based infrasructure for recognising the emotions of
Spotify songs. *International Journal of Interactive Multimedia and
Artificial Intelligence*, *8*(2), 168--181.
<https://doi.org/10.9781/ijimai.2022.04.002>

Bird, S., Klein, E., & Loper, E. (2009). *Natural language processing
with Python: Analyzing text with the natural language toolkit*. O'Reilly
Media.

Carmel, D., Haramaty, E., Lazerson, A., & Lewin-Eytan, L. (2020).
Multi-objective ranking optimization for product search using stochastic
label aggregation. In Y. Huang, I. King, T.-Y. Liu, & M. van Steen
(Eds.), *Proceedings of the web conference 2020* (pp. 373--383).
Association for Computing Machinery.
<https://doi.org/10.1145/3366423.3380122>

Costa, P. T., & McCrae, R. R. (1992). Normal personality assessment in
clinical practice: The NEO Personality Inventory. *Psychological
Assessment*, *4*(1), 5--13. <https://doi.org/10.1037/1040-3590.4.1.5>

Deldjoo, Y., Schedl, M., & Knees, P. (2024). Content-driven music
recommendation: Evolution, state of the art, and challenges. *Computer
Science Review*, *51*, Article 100618.
<https://doi.org/10.1016/j.cosrev.2024.100618>

Dijkstra, E. W. (1959). A note on two problems in connexion with graphs.
*Numerische Mathematik*, *1*(1), 269--271.
<https://doi.org/10.1007/BF01386390>

Dinnissen, K., & Bauer, C. (2022). Fairness in music recommender
systems: A stakeholder-centered mini review. *Front Big Data*, *5*,
Article 913608. <https://doi.org/10.3389/fdata.2022.913608>

Duman, D., Neto, P., Mavrolampados, A., Toiviainen, P., & Luck, G.
(2022). Music we move to: Spotify audio features and reasons for
listening. *PLoS ONE*, *17*(9), Article e0275228.
<https://doi.org/10.1371/journal.pone.0275228>

Edmonds, J., & Karp, R. M. (1972). Theoretical improvements in
algorithmic efficiency for network flow problems. *Journal of the ACM*,
*19*(2), 248--264. <https://doi.org/10.1145/321694.321699>

Embarak, O. H. (2011). A method for solving the cold start problem in
recommendation systems. In *2011 international conference on innovations
in information technology* (pp. 238--243). IEEE.
<https://doi.org/10.1109/INNOVATIONS.2011.5893824>

Hagberg, A. A., Schult, D. A., & Swart, P. J. (2008). Exploring network
structure, dynamics, and function using NetworkX. In G. Varoquaux, T.
Vaught, & J. Millman (Eds.), *Proceedings of the 7th Python in Science
Conference* (pp. 11--15). <https://doi.org/10.25080/TCWV9851>

Itzkoff, D. (2015, October 13). Inside *Pitchfork*, the site that shook
up music journalism. *WIRED*.
<https://www.wired.com/2015/10/the-pitchfork-effect/>

Logos, K., Brewer, R., Langos, C., & Westlake, B. (2023). Establishing a
framework for the ethical and legal use of web scrapers by cybercrime
and cybersecurity researchers: Learnings from a systematic review of
Australian research. *International Journal of Law and Information
Technology*, *31*(3), 186--212. <https://doi.org/10.1093/ijlit/eaad023>

Mattson, C., Bushardt, R. L., & Artino, J., Anthony R. (2021). "When a
measure becomes a target, it ceases to be a good measure." *Journal of
Graduate Medical Education*, *13*(1), 2--5.
<https://doi.org/10.4300/JGME-D-20-01492.1>

Moore, E. F. (1959). The shortest path through a maze. In *Proceedings
of the International Symposium on the Theory of Switching: Part II* (pp.
285--292). Harvard University Press.

Nave, G., Minxha, J., Greenberg, D. M., Kosinski, M., Stillwell, D., &
Rentfrow, J. (2018). Musical preferences predict personality: Evidence
from active listening and Facebook Likes. *Psychological Science*,
*29*(7), 1145--1158. <https://doi.org/10.1177/0956797618761659>

Newman, M. E. (2006). Modularity and community structure in networks.
*Proceedings of the National Academy of Sciences*, *103*(23),
8577--8582. <https://doi.org/10.1073/pnas.0601602103>

Panda, R., Redinho, H., Gonçalves, C., Malheiro, R., & Paiva, R. P.
(2021). How does the Spotify API compare to the music emotion
recognition state-of-the-art? In D. A. Mauro, S. Spagnol, & A. Valle
(Eds.), *Proceedings of the 18th Sound and Music Computing Conference*
(pp. 238--245). Axea sas/SMC Network.
<https://doi.org/10.5281/zenodo.5054146>

Pedregosa, F., Varoquaux, G., Gramfort, A., Michel, V., Thirion, B.,
Grisel, O., Blondel, M., Prettenhofer, P., Weiss, R., Dubourg, V.,
Vanderplas, J., Passos, A., Cournapeau, D., Brucher, M., Perrot, M., &
Duchesnay, É. (2011). Scikit-learn: Machine learning in Python. *Journal
of Machine Learning Research*, *12*, 2825--2830.

Ramon, Y., Matz, S. C., Farrokhnia, R., & Martens, D. (2021).
*Explainable AI for psychological profiling from digital footprints: A
case study of big five personality predictions from spending data*.
ArXiv. <https://doi.org/10.48550/arXiv.2111.06908>

Schedl, M., Zamani, H., Chen, C.-W., Deldjoo, Y., & Elahi, M. (2018).
Current challenges and visions in music recommender systems research.
*International Journal of Multimedia Information Retrieval*, *7*(2),
95--116. <https://doi.org/10.1007/s13735-018-0154-2>

Sherburne, P. (2024, June 11). *Breathe\...Godspeed* EP : Verraco.
*Pitchfork*.
<https://pitchfork.com/reviews/albums/verraco-breathe-godspeed-ep/>

Spotify. (n.d.). *Spotify for developers*. Retrieved April 1, 2024, from
<https://developer.spotify.com/>

Statista. (2021). *Volume* *of data/information created, captured,
copied, and consumed worldwide from 2010 to 2020, with forecasts from
2021 to 2025*. Retrieved April 1, 2024, from
<https://www.statista.com/statistics/871513/worldwide-data-created/>

Sun, J., Song, J., Jiang, Y., Liu, Y., & Li, J. (2021). Prick the filter
bubble: A novel cross domain recommendation model with adaptive
diversity regularization. *Electronic Markets*, *32*(1), 101--121.
<https://doi.org/10.1007/s12525-021-00492-1>

Sun, J. (2022). Personalized music recommendation algorithm based on
Spark platform. *Computational Intelligence and Neuroscience*, *2022*,
Article 7157075. <https://doi.org/10.1155/2022/7157075>

*TextBlob: Simplified text processing*. (n.d.). Retrieved April 1, 2024,
from <https://textblob.readthedocs.io/en/dev/>

Traag, V. A., Waltman, L., & Van Eck, N. J. (2019). From Louvain to
Leiden: Guaranteeing well-connected communities. *Nature Scientific
Reports*, *9*(1), Article 5233.
<https://doi.org/10.1038/s41598-019-41695-z>

Wang, S., Hu, L., Wang, Y., He, X., Sheng, Q. Z., Orgun, M., Cao, L.,
Wang, N., Ricci, F., & Yu, P. S. (2020). *Graph learning approaches to
recommender systems: A review*. ArXiv.
<https://doi.org/10.48550/arXiv.2004.11718>

Young, A. (2024, January 19). On *Pitchfork* and our commitment to music
discovery. *Consequence*.
[https://consequence.net/2024/01/on-pitchfork-and-our-commitment-to-music-discovery/](https://consequence.net/)

Zhang, Q., Liu, J., Dai, Y., Qi, Y., Yuan, Y., Zheng, K., Huang, F., &
Tan, X. (2022). Multi-task fusion via reinforcement learning for
long-term user satisfaction in recommender systems. In *Proceedings of
the 28th ACM SIGKDD conference on knowledge discovery and data mining*
(pp. 4510--4520). Association for Computing Machinery.
<https://doi.org/10.1145/3534678.3539040>

Zuse, K. (1972). Der Plankalkül \[The Plankalkül\] (Report No. 63).
*Gesellschaft für Angewandte Mathematik und Mechanik*.

------------------------------------------------------------------------

# Appendices

## Appendix A. Path-Searching and Music Recommendation Algorithms {#appendix-a-path-searching-and-music-recommendation-algorithms}

#### Algorithm 1. *K*-length Breadth-First Search Traversal with Sonic Similarity Check. {#algorithm-1-k-length-breadth-first-search-traversal-with-sonic-similarity-check}

  $\begin{array}{l}1:\ \textbf{Input: } \text{Graph } G,\ \text{starting artist } s,\ \text{desired list size } K,\ \text{sonic threshold } \tau \\2:\ G := \textit{undirected}(G) \\3:\ \textbf{Initialize:}\ \text{queue } Q \leftarrow \{s\},\ \text{visited } V \leftarrow \{s\},\ \text{result } R \leftarrow \{s\} \\4:\ \textbf{while } |R| < K\ \text{ and } Q \neq \emptyset\ \textbf{ do} \\5:\ \quad current \leftarrow Q.\text{dequeue}() \\6:\ \quad \textbf{for each neighbor } n\ \text{of } current\ \text{in } G\ \textbf{ do} \\7:\ \quad\quad \textbf{if } n \notin V\ \text{ and } |R| < K\ \textbf{ then} \\8:\ \quad\quad\quad weight \leftarrow a_{current,n} \quad \quad \quad\quad\quad\quad\quad\quad\quad\quad\quad \ {\text{\footnotesize ▷ use raw co-mention count}} \\9:\ \quad\quad\quad sonic\_dist \leftarrow \text{calculate\_sonic\_distance}(current, n) \\10:\ \quad\quad\quad \textbf{if } sonic\_dist \le \tau\ \textbf{ then} \\11:\ \quad\quad\quad\quad V \leftarrow V \cup \{n\} \\12:\ \quad\quad\quad\quad Q.\text{enqueue}(n) \\13:\ \quad\quad\quad\quad R \leftarrow R \cup \{n\} \\14:\ \quad\quad\quad \textbf{end if} \\15:\ \quad\quad \textbf{end if} \\16:\ \quad \textbf{end for} \\17:\ \textbf{end while} \\18:\ \textbf{Return: } R\end{array}$
  ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

####  Algorithm 2. Shortest Semantic Distance Path (Modified Dijkstra). {#algorithm-2-shortest-semantic-distance-path-modified-dijkstra}

  $\begin{array}{l}1:\ \textbf{Input: } \text{Graph } G,\ \text{source artist } s,\ \text{target artist } t \\2:\ \textbf{Initialize:}\ \text{distance } d[v] \leftarrow \infty\ \text{ for all } v \in V \\3:\ d[s] \leftarrow 0 \\4:\ \text{priority queue } Q\ \text{with all vertices} \\5:\ \textbf{while } Q \neq \emptyset\ \textbf{ do} \\6:\ \quad u \leftarrow \text{extract\_min}(Q) \\7:\ \quad \textbf{if } u = t\ \textbf{ then break} \\8:\ \quad \textbf{end if} \\9:\ \quad \textbf{for each neighbor } v\ \text{ of } u\ \textbf{ do} \\10:\ \quad\quad semantic\_distance \leftarrow \frac{1}{a_{u,v} + 1} \quad \ \quad\quad\quad \ {\text{\footnotesize ▷ Transform co-mentions to distance}} \\11:\ \quad\quad alt \leftarrow d[u] + semantic\_distance \\12:\ \quad\quad \textbf{if } alt < d[v]\ \textbf{ then} \\13:\ \quad\quad\quad d[v] \leftarrow alt \\14:\ \quad\quad\quad predecessor[v] \leftarrow u \\15:\ \quad\quad \textbf{end if} \\16:\ \quad \textbf{end for} \\17:\ \textbf{end while} \\18:\ \textbf{Return:}\ \text{reconstruct\_path}(predecessor,\ s,\ t)\end{array}$
  ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

####  Algorithm 3. Maximum Influence Flow (Edmonds-Karp). {#algorithm-3-maximum-influence-flow-edmonds-karp}

  $\begin{array}{l}1:\ \textbf{Input: } \text{Graph } G,\ \text{source artist } s,\ \text{sink artist } t \\2:\ \textbf{Initialize:}\ \text{flow } f \leftarrow 0,\ \text{residual graph } G_f \\3:\ \textbf{for } \text{each edge } (u,v) \in E\ \textbf{ do} \\4:\ \quad capacity[u][v] \leftarrow a_{u,v} \quad\quad\quad\quad\quad\quad\quad\quad {\text{\footnotesize ▷ Use raw co-mention count as capacity}} \\5:\ \quad capacity[v][u] \leftarrow 0 \quad\quad\quad\quad\quad\quad\quad\quad \ \ \quad\quad\quad\quad {\text{\footnotesize ▷ No reverse capacity initially}} \\6:\ \textbf{end for} \\7:\ \textbf{while } \text{there exists augmenting path } P\ \text{ from } s\ \text{ to } t\ \text{ in } G_f\ \textbf{ do} \\8:\ \quad bottleneck \leftarrow \min\{\,capacity[u][v] : (u,v) \in P\,\} \\9:\ \quad \textbf{for } \text{each edge } (u,v) \in P\ \textbf{ do} \\10:\ \quad\quad capacity[u][v] \leftarrow capacity[u][v] - bottleneck \\11:\ \quad\quad capacity[v][u] \leftarrow capacity[v][u] + bottleneck \\12:\ \quad \textbf{end for} \\13:\ \quad f \leftarrow f + bottleneck \\14:\ \textbf{end while} \\15:\ \textbf{Return: } \text{maximum flow value } f\ \text{ and augmenting path}\end{array}$
  ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

####  Algorithm 4. Multi-Artist Breadth-First Search Intersection. {#algorithm-4-multi-artist-breadth-first-search-intersection}

  ${\small\begin{array}{l}1:\ \textbf{Input: } \text{Graph } G,\ \text{artist set } S = \{s_1, s_2, \ldots, s_n\},\ \text{desired size } K \\2:\ G := undirected(G) \\3:\ \textbf{Initialize:}\ \text{current\_layer} \leftarrow S,\ \text{result } R \leftarrow \emptyset,\ \text{visited } V \leftarrow S \\4:\ \textbf{while } |R| < K\ \textbf{ and }\ \text{current\_layer} \neq \emptyset\ \textbf{ do} \\5:\ \quad \text{next\_layer} \leftarrow \emptyset \\6:\ \quad \text{intersection} \leftarrow \emptyset \\7:\ \quad \textbf{for } \text{each artist } a \in \text{current\_layer}\ \textbf{ do} \\8:\ \quad\quad \textbf{for } \text{each neighbor } n\ \text{ of } a\ \text{ with weight } a_{a,n}\ \textbf{ do}\ \ \quad\quad\quad\quad {\text{\scriptsize ▷ Use raw co-mention counts}} \\9:\ \quad\quad\quad \textbf{if } n \notin V\ \textbf{ then} \\10:\ \quad\quad\quad\quad \text{next\_layer} \leftarrow \text{next\_layer} \cup \{n\} \\11:\ \quad\quad\quad\quad V \leftarrow V \cup \{n\} \\12:\ \quad\quad\quad\quad \textbf{if } n\ \text{is neighbor of multiple artists in current\_layer}\ \textbf{ then} \\13:\ \quad\quad\quad\quad\quad \text{intersection} \leftarrow \text{intersection} \cup \{n\} \\14:\ \quad\quad\quad\quad \textbf{end if} \\15:\ \quad\quad\quad \textbf{end if} \\16:\ \quad\quad \textbf{end for} \\17:\ \quad \textbf{end for} \\18:\ \quad \text{Sort intersection by total connection strength} \\19:\ \quad \text{Add top artists from intersection to } R\ \text{ until } |R| = K\ \text{ or intersection exhausted} \\20:\ \quad \text{current\_layer} \leftarrow \text{next\_layer} \\21:\ \textbf{end while} \\22:\ \textbf{if } |R| < K\ \textbf{ then} \\23:\ \quad \text{Randomly complete } R\ \text{ from remaining artists in current\_layer} \\24:\ \textbf{end if} \\25:\ \textbf{Return: } R\end{array}}$
  ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

### A.1. Representative K-Sized Song Selection {#a1-representative-k-sized-song-selection}

####  Algorithm 5. Generate a list of representative songs based on a list of *K* recommended artists. {#algorithm-5-generate-a-list-of-representative-songs-based-on-a-list-of-k-recommended-artists}

  $\begin{array}{l}\textbf{Procedure } \text{S{\small ELECT}S{\small ONGS}}\text{(Artists, K)} \\\quad playlist \leftarrow \text{new list} \quad\quad\quad\quad\quad\quad\quad\quad\quad\quad \ {\text{\footnotesize ▷ Initialize an empty list for the playlist}} \\\quad \textbf{for } \text{each } artist \text{ in } Artists\ \textbf{ do} \\\quad\quad topSongs \leftarrow \text{getTopNSongs}(artist, N) \quad\quad \ {\text{\footnotesize ▷ Retrieve top N songs for the artist}} \\\quad\quad \textbf{if } topSongs \text{ is not empty} \textbf{ then} \\\quad\quad\quad randomSong \leftarrow \text{get RandomSong}(topSongs) \ \ {\text{\footnotesize ▷ Select a random song from}} \\ {\text{\footnotesize the topsongs}} \\\quad\quad\quad \text{Append } randomSong \text{ to } playlist \\\quad\quad \textbf{end if} \\\quad \textbf{end for} \\\quad \textbf{return } playlist \\ \textbf{end procedure}\\\textbf{function } \text{G{\small ET}T{\small OP}NS{\small ONGS}}\text{(artist, N)} \\\quad \text{Retrieve top N songs from database or API for the given } artist \\\quad \textbf{return } \text{list of songs} \\ \textbf{end function} \\\textbf{function } \text{G{\small ET}R{\small ANDOM}S{\small ONGS}}(songs) \\\quad index \leftarrow \text{random integer between } 0 \text{ and } \text{length(}\textit{songs}\text{)}-1 \\\quad \textbf{return } songs[index] \\ \textbf{end function} \\\end{array}$
  --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

## Appendix B. Using Music Genres to Generate Sonic Feature Distance Weights {#appendix-b-using-music-genres-to-generate-sonic-feature-distance-weights}

### B.1. Sonic Features {#b1-sonic-features}

As described in Sections [2](#methodology "null") and
[3](#implementation "null"), key parts of our methodology involve the
calculation of sonic distance between any two neighboring artists. To do
this, we need to select or derive a suitable metric not only utilizing
sonic features as vector inputs in pairwise distances, but weighting
each sonic feature proportional to their importance when it comes to
musically characterize artists. In order to derive such weights, we use
each of 10 sonic features averaged at the artist level (using 15,270
artists from our implementation network) to model musical genre from 60
genre labels recovered at the artist level from the Spotify API. We used
single-layer perceptron and recovered the resulting optimal feature
weights, after asserting that the model yielded acceptable performance
(although maximizing performance on this task was not the focus of this
work).

#### Table B1. Summary of sonic features across 15,270 artists. {#table-b1-summary-of-sonic-features-across-15270-artists}

+--------------------+-------------------+
| **Sonic feature**  | **Mean (SD); %**  |
+====================+===================+
| 1\. Acousticness   | 0.31 (0.34)       |
+--------------------+-------------------+
| 2\. Danceability   | 0.53 (0.20)       |
+--------------------+-------------------+
| 3\. Energy         | 0.60 (0.25)       |
+--------------------+-------------------+
| 4\.                | 0.30 (0.38)       |
| Instrumentalness   |                   |
+--------------------+-------------------+
| Key                | −0.53 (0.36)      |
+--------------------+-------------------+
| 5\. Liveness       | 0.19 (0.15)       |
+--------------------+-------------------+
| 6\. Loudness       | 0.97 (0.55)       |
+--------------------+-------------------+
| 7\. Speechiness    | 0.09 (0.10)       |
+--------------------+-------------------+
| 8\. Tempo          | 1.20 (0.29)       |
+--------------------+-------------------+
| 9\. Time signature |                   |
+--------------------+-------------------+
| 0                  | \<0.1             |
+--------------------+-------------------+
| 1                  | 1.2               |
+--------------------+-------------------+
| 3                  | 9.9               |
+--------------------+-------------------+
| 4                  | 87                |
+--------------------+-------------------+
| 5                  | 2.3               |
+--------------------+-------------------+
| 10\. Valence       | 0.43 (0.26)       |
+--------------------+-------------------+

### B.2. Genre Labels {#b2-genre-labels}

An initial Spotify API retrieval of musical genres for 15,270 artists in
our data set yielded a total of 1,920 different genres, most of which
had extremely low prevalence (e.g., 'Northamptonshire indie,' 'Danish
electropop,' 'Chapel Hill sound'). To determine a manageable yet
sufficiently granular set of musical genres, we collapsed the original
labels into 60 final ones and mapped the recoded genre labels back to
their corresponding artists. The recoding was done as follows: 1)
applying a sequence of logical substring inclusion criteria implemented
such that the sequence implies a hierarchy where the first criteria
takes precedence over the next for the more generic genres to disregard
particular suffixes (e.g., 'Northamptonshire indie' → 'indie,' 'British
alternative rock' → 'alternative rock'); 2) taking the 59 most frequent
genres after step 1, assigning them as is, and grouping the rest in a
residual category 'other.' Final genre label frequency is shown in Table
B2.

#### Table B2. Genre label frequency (*N* = 15,270 artists). {#table-b2-genre-label-frequency-n-15270-artists}

+---+-------------+---+--------------+
| * | **Frequency | * | **Frequency  |
| * | (%)**       | * | (%)**        |
| G |             | G |              |
| e |             | e |              |
| n |             | n |              |
| r |             | r |              |
| e |             | e |              |
| * |             | * |              |
| * |             | * |              |
+===+=============+===+==============+
| 1 | 13.9%       | 3 | 0.5%         |
| \ |             | 1 |              |
| . |             | \ |              |
| I |             | . |              |
| n |             | C |              |
| d |             | r |              |
| i |             | a |              |
| e |             | n |              |
|   |             | k |              |
|   |             | w |              |
|   |             | a |              |
|   |             | v |              |
|   |             | e |              |
+---+-------------+---+--------------+
| 2 | 11.1%       | 3 | 0.5%         |
| \ |             | 2 |              |
| . |             | \ |              |
| R |             | . |              |
| a |             | A |              |
| p |             | m |              |
| / |             | b |              |
| H |             | i |              |
| i |             | e |              |
| p |             | n |              |
| H |             | t |              |
| o |             |   |              |
| p |             |   |              |
+---+-------------+---+--------------+
| 3 | 9.2%        | 3 | 0.5%         |
| \ |             | 3 |              |
| . |             | \ |              |
| P |             | . |              |
| o |             | A |              |
| p |             | l |              |
|   |             | t |              |
|   |             | e |              |
|   |             | r |              |
|   |             | n |              |
|   |             | a |              |
|   |             | t |              |
|   |             | i |              |
|   |             | v |              |
|   |             | e |              |
|   |             | p |              |
|   |             | o |              |
|   |             | p |              |
+---+-------------+---+--------------+
| 4 | 5.8%        | 3 | 0.5%         |
| \ |             | 4 |              |
| . |             | \ |              |
| E |             | . |              |
| x |             | C |              |
| p |             | h |              |
| e |             | i |              |
| r |             | l |              |
| i |             | l |              |
| m |             | w |              |
| e |             | a |              |
| n |             | v |              |
| t |             | e |              |
| a |             |   |              |
| l |             |   |              |
+---+-------------+---+--------------+
| 5 | 5.4%        | 3 | 0.4%         |
| \ |             | 5 |              |
| . |             | \ |              |
| R |             | . |              |
| o |             | I |              |
| c |             | D |              |
| k |             | M |              |
+---+-------------+---+--------------+
| 6 | 4.2%        | 3 | 0.4%         |
| \ |             | 6 |              |
| . |             | \ |              |
| M |             | . |              |
| e |             | K |              |
| t |             | r |              |
| a |             | a |              |
| l |             | u |              |
|   |             | t |              |
+---+-------------+---+--------------+
| 7 | 3.9%        | 3 | 0.4%         |
| \ |             | 7 |              |
| . |             | \ |              |
| E |             | . |              |
| l |             | I |              |
| e |             | n |              |
| c |             | d |              |
| t |             | u |              |
| r |             | s |              |
| o |             | t |              |
| n |             | r |              |
| i |             | i |              |
| c |             | a |              |
|   |             | l |              |
+---+-------------+---+--------------+
| 8 | 3.4%        | 3 | 0.4%         |
| \ |             | 8 |              |
| . |             | \ |              |
| J |             | . |              |
| a |             | D |              |
| z |             | o |              |
| z |             | w |              |
|   |             | n |              |
|   |             | t |              |
|   |             | e |              |
|   |             | m |              |
|   |             | p |              |
|   |             | o |              |
+---+-------------+---+--------------+
| 9 | 3.0%        | 3 | 0.4%         |
| \ |             | 9 |              |
| . |             | \ |              |
| F |             | . |              |
| o |             | S |              |
| l |             | h |              |
| k |             | o |              |
|   |             | e |              |
|   |             | g |              |
|   |             | a |              |
|   |             | z |              |
|   |             | e |              |
+---+-------------+---+--------------+
| 1 | 2.5%        | 4 | 0.4%         |
| 0 |             | 0 |              |
| \ |             | \ |              |
| . |             | . |              |
| A |             | B |              |
| l |             | a |              |
| t |             | l |              |
| e |             | l |              |
| r |             | a |              |
| n |             | d |              |
| a |             |   |              |
| t |             |   |              |
| i |             |   |              |
| v |             |   |              |
| e |             |   |              |
| R |             |   |              |
| o |             |   |              |
| c |             |   |              |
| k |             |   |              |
+---+-------------+---+--------------+
| 1 | 2.4%        | 4 | 0.4%         |
| 1 |             | 1 |              |
| \ |             | \ |              |
| . |             | . |              |
| C |             | M |              |
| o |             | e |              |
| u |             | l |              |
| n |             | a |              |
| t |             | n |              |
| r |             | c |              |
| y |             | h |              |
|   |             | o |              |
|   |             | l |              |
|   |             | i |              |
|   |             | a |              |
+---+-------------+---+--------------+
| 1 | 2.3%        | 4 | 0.4%         |
| 2 |             | 2 |              |
| \ |             | \ |              |
| . |             | . |              |
| D |             | B |              |
| a |             | a |              |
| n |             | l |              |
| c |             | e |              |
| e |             | a |              |
|   |             | r |              |
|   |             | i |              |
|   |             | c |              |
+---+-------------+---+--------------+
| 1 | 2.3%        | 4 | 0.4%         |
| 3 |             | 3 |              |
| \ |             | \ |              |
| . |             | . |              |
| H |             | C |              |
| o |             | o |              |
| u |             | m |              |
| s |             | p |              |
| e |             | o |              |
|   |             | s |              |
|   |             | i |              |
|   |             | t |              |
|   |             | i |              |
|   |             | o |              |
|   |             | n |              |
|   |             | a |              |
|   |             | l |              |
|   |             | a |              |
|   |             | m |              |
|   |             | b |              |
|   |             | i |              |
|   |             | e |              |
|   |             | n |              |
|   |             | t |              |
+---+-------------+---+--------------+
| 1 | 2.2%        | 4 | 0.3%         |
| 4 |             | 4 |              |
| \ |             | \ |              |
| . |             | . |              |
| P |             | D |              |
| u |             | r |              |
| n |             | o |              |
| k |             | n |              |
|   |             | e |              |
+---+-------------+---+--------------+
| 1 | 2.0%        | 4 | 0.3%         |
| 5 |             | 5 |              |
| \ |             | \ |              |
| . |             | . |              |
| P |             | 2 |              |
| s |             | 1 |              |
| y |             | s |              |
| c |             | t |              |
| h |             | c |              |
| e |             | e |              |
| d |             | n |              |
| e |             | t |              |
| l |             | u |              |
| i |             | r |              |
| c |             | y |              |
|   |             | c |              |
|   |             | l |              |
|   |             | a |              |
|   |             | s |              |
|   |             | s |              |
|   |             | i |              |
|   |             | c |              |
|   |             | a |              |
|   |             | l |              |
+---+-------------+---+--------------+
| 1 | 2.0%        | 4 | 0.3%         |
| 6 |             | 6 |              |
| \ |             | \ |              |
| . |             | . |              |
| I |             | L |              |
| n |             | a |              |
| d |             | t |              |
| i |             | i |              |
| e |             | n |              |
| P |             |   |              |
| o |             |   |              |
| p |             |   |              |
+---+-------------+---+--------------+
| 1 | 1.9%        | 4 | 0.3%         |
| 7 |             | 7 |              |
| \ |             | \ |              |
| . |             | . |              |
| R |             | A |              |
| & |             | b |              |
| B |             | s |              |
|   |             | t |              |
|   |             | r |              |
|   |             | a |              |
|   |             | c |              |
|   |             | t |              |
+---+-------------+---+--------------+
| 1 | 1.6%        | 4 | 0.3%         |
| 8 |             | 8 |              |
| \ |             | \ |              |
| . |             | . |              |
| I |             | G |              |
| n |             | l |              |
| d |             | i |              |
| i |             | t |              |
| e |             | c |              |
| R |             | h |              |
| o |             |   |              |
| c |             |   |              |
| k |             |   |              |
+---+-------------+---+--------------+
| 1 | 1.5%        | 4 | 0.3%         |
| 9 |             | 9 |              |
| \ |             | \ |              |
| . |             | . |              |
| A |             | A |              |
| r |             | m |              |
| t |             | e |              |
| P |             | r |              |
| o |             | i |              |
| p |             | c |              |
|   |             | a |              |
|   |             | n |              |
|   |             | p |              |
|   |             | r |              |
|   |             | i |              |
|   |             | m |              |
|   |             | i |              |
|   |             | t |              |
|   |             | i |              |
|   |             | v |              |
|   |             | e |              |
+---+-------------+---+--------------+
| 2 | 1.4%        | 5 | 0.2%         |
| 0 |             | 0 |              |
| \ |             | \ |              |
| . |             | . |              |
| E |             | S |              |
| m |             | p |              |
| o |             | e |              |
|   |             | c |              |
|   |             | t |              |
|   |             | r |              |
|   |             | a |              |
+---+-------------+---+--------------+
| 2 | 1.3%        | 5 | 0.2%         |
| 1 |             | 1 |              |
| \ |             | \ |              |
| . |             | . |              |
| T |             | G |              |
| e |             | r |              |
| c |             | a |              |
| h |             | v |              |
| n |             | e |              |
| o |             | w |              |
|   |             | a |              |
|   |             | v |              |
|   |             | e |              |
+---+-------------+---+--------------+
| 2 | 1.2%        | 5 | 0.2%         |
| 2 |             | 2 |              |
| \ |             | \ |              |
| . |             | . |              |
| S |             | A |              |
| o |             | d |              |
| u |             | u |              |
| l |             | l |              |
|   |             | t |              |
|   |             | s |              |
|   |             | t |              |
|   |             | a |              |
|   |             | n |              |
|   |             | d |              |
|   |             | a |              |
|   |             | r |              |
|   |             | d |              |
|   |             | s |              |
+---+-------------+---+--------------+
| 2 | 1.0%        | 5 | 0.2%         |
| 3 |             | 3 |              |
| \ |             | \ |              |
| . |             | . |              |
| N |             | A |              |
| o |             | b |              |
| i |             | s |              |
| s |             | t |              |
| e |             | r |              |
|   |             | a |              |
|   |             | c |              |
|   |             | t |              |
|   |             | r |              |
|   |             | o |              |
+---+-------------+---+--------------+
| 2 | 1.0%        | 5 | 0.2%         |
| 4 |             | 4 |              |
| \ |             | \ |              |
| . |             | . |              |
| P |             | H |              |
| o |             | a |              |
| s |             | u |              |
| t |             | n |              |
| P |             | t |              |
| u |             | o |              |
| n |             | l |              |
| k |             | o |              |
|   |             | g |              |
|   |             | y |              |
+---+-------------+---+--------------+
| 2 | 0.8%        | 5 | 0.3%         |
| 5 |             | 5 |              |
| \ |             | \ |              |
| . |             | . |              |
| D |             | A |              |
| u |             | f |              |
| b |             | r |              |
| s |             | o |              |
| t |             | b |              |
| e |             | e |              |
| p |             | a |              |
|   |             | t |              |
+---+-------------+---+--------------+
| 2 | 0.8%        | 5 | 0.2%         |
| 6 |             | 6 |              |
| \ |             | \ |              |
| . |             | . |              |
| C |             | C |              |
| l |             | h |              |
| u |             | a |              |
| b |             | o |              |
|   |             | t |              |
|   |             | i |              |
|   |             | c |              |
|   |             | h |              |
|   |             | a |              |
|   |             | r |              |
|   |             | d |              |
|   |             | c |              |
|   |             | o |              |
|   |             | r |              |
|   |             | e |              |
+---+-------------+---+--------------+
| 2 | 0.8%        | 5 | 0.2%         |
| 7 |             | 7 |              |
| \ |             | \ |              |
| . |             | . |              |
| G |             | A |              |
| r |             | r |              |
| u |             | t |              |
| n |             | r |              |
| g |             | o |              |
| e |             | c |              |
|   |             | k |              |
+---+-------------+---+--------------+
| 2 | 0.7%        | 5 | 0.2%         |
| 8 |             | 8 |              |
| \ |             | \ |              |
| . |             | . |              |
| A |             | F |              |
| m |             | u |              |
| e |             | n |              |
| r |             | k |              |
| i |             |   |              |
| c |             |   |              |
| a |             |   |              |
| n |             |   |              |
| a |             |   |              |
+---+-------------+---+--------------+
| 2 | 0.6%        | 5 | 0.2%         |
| 9 |             | 9 |              |
| \ |             | \ |              |
| . |             | . |              |
| A |             | B |              |
| f |             | r |              |
| r |             | e |              |
| o |             | a |              |
| f |             | k |              |
| u |             | c |              |
| t |             | o |              |
| u |             | r |              |
| r |             | e |              |
| i |             |   |              |
| s |             |   |              |
| m |             |   |              |
+---+-------------+---+--------------+
| 3 | 0.6%        | 6 | 20.1%        |
| 0 |             | 0 |              |
| \ |             | \ |              |
| . |             | . |              |
| B |             | O |              |
| l |             | t |              |
| u |             | h |              |
| e |             | e |              |
| s |             | r |              |
+---+-------------+---+--------------+
| * |             |   | 100.0%       |
| * |             |   |              |
| T |             |   |              |
| o |             |   |              |
| t |             |   |              |
| a |             |   |              |
| l |             |   |              |
| * |             |   |              |
| * |             |   |              |
+---+-------------+---+--------------+

####  Table B3. Sonic features by genre (*N* = 15,270 artists). {#table-b3-sonic-features-by-genre-n-15270-artists}

| **Sonic Feature (Mean, SD)** | **Acousticness** | **Danceability** | **Energy**  | **Key**      | **Instrumentalness** | **Liveness** | **Loudness** | **Tempo**   | **Time signature** | **Speechiness** | **Valence** |
|-----------|-----------|-----------|---------|----------|--------------|----------|--|--|--|--|--|
| 21st Century Classical       | 0.79 (0.30)      | 0.34 (0.14)      | 0.20 (0.18) | -0.44 (0.34) | 0.46 (0.38)          | 0.12 (0.05)  | 1.82 (0.59)  | 1.09 (0.31) | 3.78 (0.56)        | 0.05 (0.05)     | 0.14 (0.12) |
| Abstract                     | 0.33 (0.38)      | 0.49 (0.21)      | 0.57 (0.29) | -0.56 (0.36) | 0.66 (0.34)          | 0.16 (0.12)  | 1.30 (0.66)  | 1.21 (0.35) | 3.78 (0.75)        | 0.08 (0.10)     | 0.33 (0.27) |
| Abstractro                   | 0.55 (0.36)      | 0.32 (0.17)      | 0.49 (0.20) | -0.48 (0.36) | 0.61 (0.42)          | 0.17 (0.11)  | 1.16 (0.42)  | 1.14 (0.37) | 3.83 (0.49)        | 0.07 (0.09)     | 0.17 (0.16) |
| Adult Standards              | 0.50 (0.31)      | 0.55 (0.15)      | 0.45 (0.24) | -0.57 (0.35) | 0.06 (0.20)          | 0.17 (0.11)  | 1.17 (0.47)  | 1.17 (0.31) | 3.88 (0.34)        | 0.06 (0.05)     | 0.55 (0.24) |
| Afrobeat                     | 0.22 (0.24)      | 0.70 (0.09)      | 0.68 (0.16) | -0.49 (0.36) | 0.31 (0.36)          | 0.14 (0.09)  | 0.85 (0.30)  | 1.12 (0.20) | 4.00 (0.00)        | 0.06 (0.05)     | 0.69 (0.23) |
| Afrofuturism                 | 0.29 (0.30)      | 0.57 (0.20)      | 0.59 (0.20) | -0.52 (0.37) | 0.33 (0.38)          | 0.19 (0.13)  | 0.97 (0.36)  | 1.17 (0.27) | 3.93 (0.46)        | 0.10 (0.09)     | 0.48 (0.25) |
| Alternative Pop              | 0.24 (0.28)      | 0.56 (0.13)      | 0.65 (0.22) | -0.57 (0.34) | 0.18 (0.29)          | 0.19 (0.15)  | 0.83 (0.34)  | 1.21 (0.25) | 3.91 (0.36)        | 0.06 (0.07)     | 0.50 (0.24) |
| Alternative Rock             | 0.19 (0.28)      | 0.51 (0.16)      | 0.68 (0.22) | -0.52 (0.35) | 0.17 (0.29)          | 0.19 (0.15)  | 0.82 (0.40)  | 1.24 (0.29) | 3.93 (0.39)        | 0.06 (0.07)     | 0.50 (0.25) |
| Ambient                      | 0.78 (0.30)      | 0.32 (0.20)      | 0.23 (0.24) | -0.54 (0.40) | 0.78 (0.27)          | 0.14 (0.10)  | 2.03 (0.69)  | 1.01 (0.35) | 3.70 (0.77)        | 0.06 (0.06)     | 0.17 (0.19) |
| American Primitive           | 0.62 (0.32)      | 0.37 (0.15)      | 0.37 (0.22) | -0.49 (0.27) | 0.64 (0.32)          | 0.16 (0.11)  | 1.22 (0.50)  | 1.14 (0.27) | 3.68 (0.90)        | 0.05 (0.02)     | 0.24 (0.24) |
| Americana                    | 0.43 (0.33)      | 0.54 (0.15)      | 0.53 (0.21) | -0.62 (0.34) | 0.19 (0.33)          | 0.14 (0.12)  | 0.90 (0.43)  | 1.14 (0.27) | 3.90 (0.30)        | 0.06 (0.12)     | 0.45 (0.22) |
| Art Pop                      | 0.38 (0.36)      | 0.56 (0.18)      | 0.52 (0.24) | -0.40 (0.35) | 0.20 (0.31)          | 0.15 (0.11)  | 0.97 (0.44)  | 1.18 (0.27) | 3.86 (0.58)        | 0.06 (0.06)     | 0.43 (0.26) |
| Art Rock                     | 0.32 (0.24)      | 0.56 (0.17)      | 0.56 (0.22) | -0.38 (0.33) | 0.10 (0.22)          | 0.15 (0.11)  | 0.99 (0.41)  | 1.11 (0.22) | 4.00 (0.33)        | 0.05 (0.04)     | 0.44 (0.25) |
| Balearic                     | 0.15 (0.22)      | 0.67 (0.12)      | 0.71 (0.15) | -0.54 (0.35) | 0.59 (0.32)          | 0.20 (0.17)  | 0.90 (0.20)  | 1.14 (0.13) | 4.00 (0.23)        | 0.05 (0.03)     | 0.58 (0.28) |
| Ballad                       | 0.21 (0.24)      | 0.62 (0.15)      | 0.70 (0.19) | -0.46 (0.36) | 0.12 (0.28)          | 0.17 (0.12)  | 0.87 (0.35)  | 1.28 (0.25) | 3.90 (0.31)        | 0.07 (0.06)     | 0.67 (0.19) |
| Blues                        | 0.41 (0.32)      | 0.57 (0.14)      | 0.60 (0.23) | -0.49 (0.37) | 0.19 (0.34)          | 0.13 (0.06)  | 0.88 (0.37)  | 1.19 (0.32) | 3.91 (0.29)        | 0.05 (0.03)     | 0.58 (0.25) |
| Breakcore                    | 0.10 (0.23)      | 0.53 (0.17)      | 0.83 (0.18) | -0.48 (0.41) | 0.41 (0.40)          | 0.29 (0.19)  | 0.77 (0.50)  | 1.36 (0.31) | 3.83 (0.39)        | 0.16 (0.13)     | 0.40 (0.23) |
| Chaotic Hardcore             | 0.03 (0.10)      | 0.38 (0.15)      | 0.89 (0.17) | -0.60 (0.35) | 0.41 (0.41)          | 0.41 (0.23)  | 0.55 (0.17)  | 1.17 (0.34) | 3.81 (0.51)        | 0.11 (0.08)     | 0.31 (0.22) |
| Chillwave                    | 0.28 (0.28)      | 0.57 (0.17)      | 0.62 (0.19) | -0.52 (0.33) | 0.48 (0.34)          | 0.18 (0.11)  | 0.92 (0.30)  | 1.21 (0.29) | 3.85 (0.51)        | 0.06 (0.05)     | 0.38 (0.25) |
| Club                         | 0.27 (0.32)      | 0.52 (0.19)      | 0.59 (0.24) | -0.54 (0.35) | 0.38 (0.38)          | 0.19 (0.16)  | 0.99 (0.44)  | 1.29 (0.29) | 3.92 (0.36)        | 0.12 (0.14)     | 0.34 (0.23) |
| Compositional Ambient        | 0.86 (0.27)      | 0.39 (0.16)      | 0.19 (0.24) | -0.53 (0.38) | 0.77 (0.30)          | 0.13 (0.07)  | 2.15 (0.88)  | 1.10 (0.28) | 3.59 (0.73)        | 0.04 (0.01)     | 0.27 (0.26) |
| Country                      | 0.43 (0.33)      | 0.53 (0.14)      | 0.51 (0.24) | -0.54 (0.34) | 0.13 (0.28)          | 0.18 (0.16)  | 0.96 (0.42)  | 1.17 (0.27) | 3.78 (0.61)        | 0.04 (0.03)     | 0.47 (0.25) |
| Crank Wave                   | 0.15 (0.24)      | 0.50 (0.18)      | 0.71 (0.23) | -0.59 (0.39) | 0.25 (0.32)          | 0.20 (0.14)  | 0.79 (0.49)  | 1.26 (0.26) | 3.89 (0.47)        | 0.09 (0.09)     | 0.45 (0.24) |
| Dance                        | 0.13 (0.20)      | 0.65 (0.15)      | 0.73 (0.18) | -0.54 (0.37) | 0.13 (0.27)          | 0.18 (0.14)  | 0.66 (0.31)  | 1.22 (0.23) | 3.96 (0.27)        | 0.08 (0.08)     | 0.57 (0.25) |
| Downtempo                    | 0.26 (0.29)      | 0.65 (0.21)      | 0.56 (0.25) | -0.59 (0.37) | 0.34 (0.36)          | 0.16 (0.11)  | 1.02 (0.57)  | 1.15 (0.34) | 3.80 (0.79)        | 0.07 (0.06)     | 0.37 (0.25) |
| Drone                        | 0.54 (0.40)      | 0.30 (0.23)      | 0.32 (0.28) | -0.50 (0.36) | 0.61 (0.40)          | 0.18 (0.14)  | 1.65 (0.82)  | 1.07 (0.32) | 3.46 (1.06)        | 0.06 (0.05)     | 0.19 (0.25) |
| Dubstep                      | 0.32 (0.36)      | 0.59 (0.22)      | 0.59 (0.25) | -0.53 (0.35) | 0.50 (0.41)          | 0.18 (0.15)  | 1.23 (0.77)  | 1.23 (0.35) | 3.82 (0.69)        | 0.12 (0.11)     | 0.43 (0.29) |
| Electronic                   | 0.28 (0.34)      | 0.57 (0.22)      | 0.57 (0.25) | -0.54 (0.38) | 0.53 (0.39)          | 0.17 (0.14)  | 1.12 (0.59)  | 1.22 (0.27) | 3.91 (0.49)        | 0.07 (0.07)     | 0.38 (0.27) |
| Emo                          | 0.11 (0.22)      | 0.44 (0.16)      | 0.77 (0.20) | -0.54 (0.35) | 0.12 (0.26)          | 0.18 (0.13)  | 0.66 (0.32)  | 1.26 (0.31) | 3.87 (0.52)        | 0.08 (0.07)     | 0.41 (0.19) |
| Experimental                 | 0.44 (0.38)      | 0.45 (0.22)      | 0.51 (0.28) | -0.54 (0.36) | 0.54 (0.39)          | 0.19 (0.15)  | 1.29 (0.69)  | 1.14 (0.29) | 3.83 (0.63)        | 0.08 (0.10)     | 0.31 (0.27) |
| Folk                         | 0.58 (0.33)      | 0.47 (0.17)      | 0.43 (0.24) | -0.55 (0.36) | 0.26 (0.36)          | 0.17 (0.14)  | 1.17 (0.53)  | 1.16 (0.29) | 3.85 (0.48)        | 0.05 (0.07)     | 0.40 (0.27) |
| Funk                         | 0.30 (0.28)      | 0.68 (0.15)      | 0.57 (0.17) | -0.38 (0.37) | 0.11 (0.22)          | 0.13 (0.12)  | 0.87 (0.25)  | 1.08 (0.20) | 3.89 (0.32)        | 0.05 (0.02)     | 0.61 (0.23) |
| Glitch                       | 0.47 (0.42)      | 0.43 (0.21)      | 0.47 (0.24) | -0.42 (0.33) | 0.58 (0.35)          | 0.19 (0.15)  | 1.46 (0.54)  | 1.11 (0.34) | 3.80 (0.82)        | 0.16 (0.20)     | 0.25 (0.25) |
| Grave Wave                   | 0.08 (0.15)      | 0.54 (0.14)      | 0.78 (0.18) | -0.40 (0.32) | 0.47 (0.37)          | 0.18 (0.13)  | 0.68 (0.26)  | 1.37 (0.30) | 3.92 (0.28)        | 0.06 (0.04)     | 0.43 (0.23) |
| Grunge                       | 0.17 (0.27)      | 0.50 (0.15)      | 0.69 (0.21) | -0.58 (0.35) | 0.16 (0.27)          | 0.20 (0.16)  | 0.73 (0.45)  | 1.32 (0.29) | 3.94 (0.30)        | 0.05 (0.04)     | 0.48 (0.25) |
| Hauntology                   | 0.52 (0.40)      | 0.43 (0.18)      | 0.47 (0.22) | -0.44 (0.36) | 0.78 (0.26)          | 0.24 (0.19)  | 1.28 (0.51)  | 1.25 (0.32) | 3.69 (0.48)        | 0.05 (0.04)     | 0.30 (0.26) |
| House                        | 0.18 (0.28)      | 0.67 (0.17)      | 0.67 (0.21) | -0.54 (0.37) | 0.49 (0.39)          | 0.18 (0.14)  | 0.97 (0.47)  | 1.23 (0.20) | 3.94 (0.40)        | 0.07 (0.06)     | 0.47 (0.26) |
| IDM                          | 0.35 (0.35)      | 0.55 (0.20)      | 0.55 (0.25) | -0.38 (0.37) | 0.65 (0.35)          | 0.14 (0.07)  | 1.21 (0.57)  | 1.24 (0.27) | 3.86 (0.41)        | 0.06 (0.06)     | 0.33 (0.24) |
| Indie                        | 0.30 (0.33)      | 0.52 (0.17)      | 0.62 (0.24) | -0.51 (0.36) | 0.25 (0.34)          | 0.18 (0.14)  | 0.87 (0.42)  | 1.23 (0.30) | 3.91 (0.41)        | 0.06 (0.06)     | 0.47 (0.25) |
| Indie Pop                    | 0.28 (0.32)      | 0.56 (0.15)      | 0.63 (0.23) | -0.57 (0.37) | 0.15 (0.28)          | 0.19 (0.14)  | 0.80 (0.34)  | 1.19 (0.28) | 3.93 (0.33)        | 0.09 (0.09)     | 0.48 (0.23) |
| Indie Rock                   | 0.23 (0.30)      | 0.48 (0.18)      | 0.66 (0.23) | -0.51 (0.33) | 0.21 (0.32)          | 0.20 (0.19)  | 0.81 (0.44)  | 1.25 (0.31) | 3.90 (0.43)        | 0.06 (0.05)     | 0.44 (0.25) |
| Industrial                   | 0.24 (0.33)      | 0.47 (0.18)      | 0.65 (0.25) | -0.53 (0.33) | 0.53 (0.36)          | 0.25 (0.19)  | 1.11 (0.59)  | 1.22 (0.27) | 3.98 (0.42)        | 0.08 (0.08)     | 0.28 (0.25) |
| Jazz                         | 0.43 (0.36)      | 0.49 (0.17)      | 0.49 (0.26) | -0.51 (0.36) | 0.45 (0.39)          | 0.17 (0.14)  | 1.24 (0.59)  | 1.13 (0.29) | 3.82 (0.55)        | 0.08 (0.08)     | 0.37 (0.24) |
| Kraut                        | 0.31 (0.34)      | 0.46 (0.15)      | 0.61 (0.27) | -0.63 (0.34) | 0.45 (0.40)          | 0.20 (0.16)  | 1.02 (0.52)  | 1.28 (0.31) | 3.93 (0.41)        | 0.06 (0.06)     | 0.36 (0.22) |
| Latin                        | 0.35 (0.34)      | 0.60 (0.18)      | 0.63 (0.19) | -0.67 (0.33) | 0.20 (0.30)          | 0.14 (0.08)  | 0.81 (0.34)  | 1.19 (0.32) | 3.89 (0.70)        | 0.07 (0.06)     | 0.56 (0.26) |
| Melancholia                  | 0.43 (0.36)      | 0.49 (0.13)      | 0.42 (0.21) | -0.51 (0.36) | 0.25 (0.31)          | 0.17 (0.12)  | 1.19 (0.41)  | 1.12 (0.23) | 3.79 (0.41)        | 0.04 (0.01)     | 0.34 (0.24) |
| Metal                        | 0.10 (0.24)      | 0.37 (0.19)      | 0.77 (0.22) | -0.52 (0.35) | 0.43 (0.38)          | 0.21 (0.16)  | 0.75 (0.37)  | 1.23 (0.31) | 3.82 (0.59)        | 0.08 (0.07)     | 0.30 (0.23) |
| Noise                        | 0.15 (0.27)      | 0.38 (0.20)      | 0.73 (0.25) | -0.58 (0.33) | 0.42 (0.39)          | 0.22 (0.17)  | 0.81 (0.54)  | 1.26 (0.30) | 3.90 (0.56)        | 0.09 (0.10)     | 0.33 (0.24) |
| Other                        | 0.34 (0.35)      | 0.52 (0.20)      | 0.58 (0.27) | -0.52 (0.36) | 0.32 (0.39)          | 0.19 (0.16)  | 1.03 (0.60)  | 1.19 (0.30) | 3.88 (0.50)        | 0.09 (0.11)     | 0.42 (0.27) |
| Pop                          | 0.31 (0.33)      | 0.53 (0.18)      | 0.61 (0.24) | -0.54 (0.35) | 0.22 (0.33)          | 0.18 (0.14)  | 0.87 (0.48)  | 1.21 (0.28) | 3.91 (0.42)        | 0.06 (0.06)     | 0.45 (0.25) |
| Post Punk                    | 0.12 (0.22)      | 0.49 (0.16)      | 0.72 (0.21) | -0.51 (0.38) | 0.39 (0.38)          | 0.20 (0.16)  | 0.86 (0.46)  | 1.32 (0.24) | 3.91 (0.42)        | 0.06 (0.05)     | 0.50 (0.24) |
| Psychaedelic                 | 0.26 (0.30)      | 0.50 (0.18)      | 0.65 (0.22) | -0.51 (0.36) | 0.36 (0.37)          | 0.21 (0.17)  | 0.88 (0.41)  | 1.19 (0.28) | 3.88 (0.46)        | 0.07 (0.10)     | 0.44 (0.26) |
| Punk                         | 0.12 (0.21)      | 0.47 (0.18)      | 0.79 (0.20) | -0.56 (0.36) | 0.23 (0.33)          | 0.21 (0.15)  | 0.67 (0.35)  | 1.31 (0.32) | 3.90 (0.47)        | 0.09 (0.08)     | 0.51 (0.26) |
| R&B                          | 0.28 (0.26)      | 0.64 (0.15)      | 0.57 (0.17) | -0.50 (0.35) | 0.10 (0.24)          | 0.17 (0.13)  | 0.83 (0.29)  | 1.15 (0.30) | 3.94 (0.46)        | 0.13 (0.12)     | 0.50 (0.23) |
| Rap/Hip Hop                  | 0.21 (0.23)      | 0.67 (0.16)      | 0.66 (0.17) | -0.54 (0.37) | 0.06 (0.20)          | 0.21 (0.17)  | 0.74 (0.32)  | 1.17 (0.30) | 3.98 (0.33)        | 0.21 (0.14)     | 0.51 (0.23) |
| Rock                         | 0.23 (0.30)      | 0.47 (0.18)      | 0.66 (0.24) | -0.53 (0.35) | 0.26 (0.36)          | 0.20 (0.16)  | 0.86 (0.45)  | 1.22 (0.30) | 3.92 (0.38)        | 0.06 (0.05)     | 0.45 (0.26) |
| Shoegaze                     | 0.12 (0.25)      | 0.46 (0.20)      | 0.68 (0.20) | -0.53 (0.34) | 0.50 (0.38)          | 0.25 (0.20)  | 0.85 (0.39)  | 1.23 (0.30) | 3.95 (0.22)        | 0.07 (0.06)     | 0.40 (0.23) |
| Soul                         | 0.29 (0.31)      | 0.58 (0.15)      | 0.60 (0.21) | -0.52 (0.37) | 0.11 (0.25)          | 0.20 (0.18)  | 0.84 (0.35)  | 1.16 (0.27) | 3.92 (0.39)        | 0.08 (0.08)     | 0.51 (0.26) |
| Spectra                      | 0.86 (0.16)      | 0.28 (0.19)      | 0.29 (0.19) | -0.62 (0.30) | 0.62 (0.38)          | 0.17 (0.17)  | 1.78 (0.66)  | 1.02 (0.35) | 3.80 (0.59)        | 0.05 (0.03)     | 0.14 (0.16) |
| Techno                       | 0.23 (0.31)      | 0.60 (0.18)      | 0.61 (0.23) | -0.62 (0.36) | 0.62 (0.37)          | 0.19 (0.17)  | 1.12 (0.53)  | 1.25 (0.26) | 3.91 (0.52)        | 0.08 (0.07)     | 0.39 (0.27) |
| **p-value**                  | **\<0.001**      | **\<0.001**      | **\<0.001** | **0.005**    | **\<0.001**          | **\<0.001**  | **\<0.001**  | **\<0.001** | **\<0.001**        | **\<0.001**     | **\<0.001** |

## Appendix C. Algorithm Complexity Analysis {#appendix-c-algorithm-complexity-analysis}

This appendix provides theoretical and empirical complexity analysis for
the core algorithms in our framework, demonstrating the computational
efficiency of our network-based approach.

### C.1. Computational Complexity {#c1-computational-complexity}

Table C1 summarizes the theoretical complexity and measured performance
of each algorithm component on our full network of 22,831 artists and
159,389 edges.

#### Table C1. Theoretical complexity and measured performance for core algorithms. {#table-c1-theoretical-complexity-and-measured-performance-for-core-algorithms}

+---------------------+----------------------+---+
| **Algorithm**       | **Theoretical        | * |
|                     | Complexity**         | * |
|                     |                      | P |
|                     |                      | r |
|                     |                      | a |
|                     |                      | c |
|                     |                      | t |
|                     |                      | i |
|                     |                      | c |
|                     |                      | a |
|                     |                      | l |
|                     |                      | P |
|                     |                      | e |
|                     |                      | r |
|                     |                      | f |
|                     |                      | o |
|                     |                      | r |
|                     |                      | m |
|                     |                      | a |
|                     |                      | n |
|                     |                      | c |
|                     |                      | e |
|                     |                      | * |
|                     |                      | * |
+=====================+======================+===+
| Graph Construction  | $O(|V|^2)$ worst     | $ |
|                     | case                 | O |
|                     |                      | ( |
|                     |                      | | |
|                     |                      | V |
|                     |                      | | |
|                     |                      |   |
|                     |                      | \ |
|                     |                      | l |
|                     |                      | o |
|                     |                      | g |
|                     |                      |   |
|                     |                      | | |
|                     |                      | V |
|                     |                      | | |
|                     |                      | ) |
|                     |                      | $ |
|                     |                      | o |
|                     |                      | b |
|                     |                      | s |
|                     |                      | e |
|                     |                      | r |
|                     |                      | v |
|                     |                      | e |
|                     |                      | d |
+---------------------+----------------------+---+
| Community Detection | $O(|E| \log |V|)$    | 2 |
| (Leiden)            |                      | . |
|                     |                      | 3 |
|                     |                      | s |
|                     |                      | f |
|                     |                      | o |
|                     |                      | r |
|                     |                      | f |
|                     |                      | u |
|                     |                      | l |
|                     |                      | l |
|                     |                      | g |
|                     |                      | r |
|                     |                      | a |
|                     |                      | p |
|                     |                      | h |
+---------------------+----------------------+---+
| BFS Recommendations | $O(|V| + |E|)$       | \ |
|                     |                      | < |
|                     |                      | 5 |
|                     |                      | 0 |
|                     |                      | m |
|                     |                      | s |
|                     |                      | f |
|                     |                      | o |
|                     |                      | r |
|                     |                      | * |
|                     |                      | K |
|                     |                      | * |
|                     |                      | = |
|                     |                      | 2 |
|                     |                      | 0 |
+---------------------+----------------------+---+
| Dijkstra Shortest   | $O(                  | \ |
| Path                | |E| + |V| \log |V|)$ | < |
|                     |                      | 1 |
|                     |                      | 0 |
|                     |                      | 0 |
|                     |                      | m |
|                     |                      | s |
|                     |                      | t |
|                     |                      | y |
|                     |                      | p |
|                     |                      | i |
|                     |                      | c |
|                     |                      | a |
|                     |                      | l |
+---------------------+----------------------+---+
| Edmonds-Karp Max    | $O(|V| \cdot |E|^2)$ | \ |
| Flow                |                      | < |
|                     |                      | 2 |
|                     |                      | 0 |
|                     |                      | 0 |
|                     |                      | m |
|                     |                      | s |
|                     |                      | f |
|                     |                      | o |
|                     |                      | r |
|                     |                      | d |
|                     |                      | e |
|                     |                      | n |
|                     |                      | s |
|                     |                      | e |
|                     |                      | s |
|                     |                      | u |
|                     |                      | b |
|                     |                      | g |
|                     |                      | r |
|                     |                      | a |
|                     |                      | p |
|                     |                      | h |
|                     |                      | s |
+---------------------+----------------------+---+
| Sonic Distance      | $O(1)$ per lookup    | \ |
| Calculation         |                      | < |
|                     |                      | 1 |
|                     |                      | m |
|                     |                      | s |
|                     |                      | a |
|                     |                      | f |
|                     |                      | t |
|                     |                      | e |
|                     |                      | r |
|                     |                      | p |
|                     |                      | r |
|                     |                      | e |
|                     |                      | - |
|                     |                      | p |
|                     |                      | r |
|                     |                      | o |
|                     |                      | c |
|                     |                      | e |
|                     |                      | s |
|                     |                      | s |
|                     |                      | i |
|                     |                      | n |
|                     |                      | g |
+---------------------+----------------------+---+

The graph construction achieves better than worst-case performance due
to the sparse nature of the influence network (density = 0.001),
allowing efficient edge insertion using hash-based data structures.
Community detection using the Leiden algorithm completes in 2.3 seconds
for the entire network, enabling real-time community analysis for
subgraphs.

Recommendation algorithms demonstrate subsecond response times suitable
for interactive use. Breadth-first search traversal with sonic
similarity filtering typically completes in under 50 ms for standard
recommendation sizes (*K*= 20), while more complex algorithms like max
flow remain responsive even for dense artist neighborhoods.

### C.2. Memory Requirements {#c2-memory-requirements}

The framework's memory footprint remains manageable for deployment on
standard hardware:

#### Table C2. Memory requirements for core data structures. {#table-c2-memory-requirements-for-core-data-structures}

+-----------------------+--------------+---+
| **Data Structure**    | **Memory     | * |
|                       | Usage**      | * |
|                       |              | D |
|                       |              | e |
|                       |              | t |
|                       |              | a |
|                       |              | i |
|                       |              | l |
|                       |              | s |
|                       |              | * |
|                       |              | * |
+=======================+==============+===+
| Sparse Adjacency      | 2.1 GB       | 2 |
| Matrix                |              | 2 |
|                       |              | , |
|                       |              | 8 |
|                       |              | 3 |
|                       |              | 1 |
|                       |              | × |
|                       |              | 2 |
|                       |              | 2 |
|                       |              | , |
|                       |              | 8 |
|                       |              | 3 |
|                       |              | 1 |
|                       |              | s |
|                       |              | p |
|                       |              | a |
|                       |              | r |
|                       |              | s |
|                       |              | e |
|                       |              | m |
|                       |              | a |
|                       |              | t |
|                       |              | r |
|                       |              | i |
|                       |              | x |
+-----------------------+--------------+---+
| Sonic Feature Matrix  | 890 KB       | 2 |
|                       |              | 2 |
|                       |              | , |
|                       |              | 8 |
|                       |              | 3 |
|                       |              | 1 |
|                       |              | a |
|                       |              | r |
|                       |              | t |
|                       |              | i |
|                       |              | s |
|                       |              | t |
|                       |              | s |
|                       |              | × |
|                       |              | 1 |
|                       |              | 0 |
|                       |              | f |
|                       |              | e |
|                       |              | a |
|                       |              | t |
|                       |              | u |
|                       |              | r |
|                       |              | e |
|                       |              | s |
+-----------------------+--------------+---+
| Community Assignments | 84 KB        | I |
|                       |              | n |
|                       |              | t |
|                       |              | e |
|                       |              | g |
|                       |              | e |
|                       |              | r |
|                       |              | a |
|                       |              | r |
|                       |              | r |
|                       |              | a |
|                       |              | y |
|                       |              | f |
|                       |              | o |
|                       |              | r |
|                       |              | 2 |
|                       |              | 2 |
|                       |              | , |
|                       |              | 8 |
|                       |              | 3 |
|                       |              | 1 |
|                       |              | a |
|                       |              | r |
|                       |              | t |
|                       |              | i |
|                       |              | s |
|                       |              | t |
|                       |              | s |
+-----------------------+--------------+---+
| Artist Metadata       | 3.2 MB       | N |
|                       |              | a |
|                       |              | m |
|                       |              | e |
|                       |              | s |
|                       |              | , |
|                       |              | g |
|                       |              | e |
|                       |              | n |
|                       |              | r |
|                       |              | e |
|                       |              | s |
|                       |              | , |
|                       |              | t |
|                       |              | e |
|                       |              | m |
|                       |              | p |
|                       |              | o |
|                       |              | r |
|                       |              | a |
|                       |              | l |
|                       |              | d |
|                       |              | a |
|                       |              | t |
|                       |              | a |
+-----------------------+--------------+---+
| Influence Scores      | 178 KB       | P |
|                       |              | r |
|                       |              | e |
|                       |              | - |
|                       |              | c |
|                       |              | o |
|                       |              | m |
|                       |              | p |
|                       |              | u |
|                       |              | t |
|                       |              | e |
|                       |              | d |
|                       |              | f |
|                       |              | o |
|                       |              | r |
|                       |              | a |
|                       |              | l |
|                       |              | l |
|                       |              | a |
|                       |              | r |
|                       |              | t |
|                       |              | i |
|                       |              | s |
|                       |              | t |
|                       |              | s |
+-----------------------+--------------+---+
| Edge Weight Cache     | 1.2 MB       | F |
|                       |              | r |
|                       |              | e |
|                       |              | q |
|                       |              | u |
|                       |              | e |
|                       |              | n |
|                       |              | t |
|                       |              | l |
|                       |              | y |
|                       |              | a |
|                       |              | c |
|                       |              | c |
|                       |              | e |
|                       |              | s |
|                       |              | s |
|                       |              | e |
|                       |              | d |
|                       |              | c |
|                       |              | o |
|                       |              | n |
|                       |              | n |
|                       |              | e |
|                       |              | c |
|                       |              | t |
|                       |              | i |
|                       |              | o |
|                       |              | n |
|                       |              | s |
+-----------------------+--------------+---+
| **Total**             | ≈ 2.1 GB     | F |
|                       |              | i |
|                       |              | t |
|                       |              | s |
|                       |              | i |
|                       |              | n |
|                       |              | R |
|                       |              | A |
|                       |              | M |
|                       |              | o |
|                       |              | n |
|                       |              | s |
|                       |              | t |
|                       |              | a |
|                       |              | n |
|                       |              | d |
|                       |              | a |
|                       |              | r |
|                       |              | d |
|                       |              | s |
|                       |              | y |
|                       |              | s |
|                       |              | t |
|                       |              | e |
|                       |              | m |
|                       |              | s |
+-----------------------+--------------+---+

The sparse representation of the adjacency matrix reduces memory
requirements from a theoretical $O(|V|^2)$ to $O(|E|)$, crucial for
scalability. Precomputation of sonic distances and influence scores
enables constant-time lookups during recommendation generation.

### C.3. Scalability Analysis {#c3-scalability-analysis}

The network-based approach offers favorable scaling properties compared
to traditional collaborative filtering:

-   **User-independent complexity**: Algorithm performance depends only
    on graph size, not user count

-   **Linear artist scaling:** Adding new artists requires $O(|V|)$ edge
    computations in worst case

-   **Parallelizable operations:** Community detection and path searches
    can be distributed across cores

-   **Incremental updates:** New reviews can be incorporated without
    full graph reconstruction

As the graph grows, the sparse structure (density ≈ 0.001) ensures that
average degree remains bounded, maintaining efficient traversal
operations. This contrasts with collaborative filtering where complexity
grows with both users and items, making our approach particularly
suitable for large-scale deployment.

------------------------------------------------------------------------

©2025** **Elena Badillo-Goicoechea. This article is licensed under a
[Creative Commons Attribution (CC BY 4.0) International
license](https://creativecommons.org/licenses/by/4.0/legalcode "null"),
except where otherwise indicated with respect to particular material
included in the article.

[^1]: Graph density is the ratio between edges present and maximum
    possible edges.

[^2]: Modularity [[$Q$]{.katex-mathml}[[[]{.strut
    style="height:0.8778em;vertical-align:-0.1944em;"}[Q]{.mord
    .mathnormal}]{.base}]{.katex-html aria-hidden="true"}]{.katex}
    measures how well artists cluster into distinct musical communities
    versus random connections, calculated as
    [[$Q = \frac{1}{2m}\sum_{ij}\left\lbrack A_{ij} - \frac{k_{i}k_{j}}{2m} \right\rbrack\delta(c_{i},c_{j})$]{.katex-mathml}[[[]{.strut
    style="height:0.8778em;vertical-align:-0.1944em;"}[Q]{.mord
    .mathnormal}[]{.mspace
    style="margin-right:0.2778em;"}[=]{.mrel}[]{.mspace
    style="margin-right:0.2778em;"}]{.base}[[]{.strut
    style="height:1.8em;vertical-align:-0.65em;"}[[]{.mopen
    .nulldelimiter}[[[[[[]{.pstrut style="height:3em;"}[[[2]{.mord
    .mtight}[m]{.mord .mathnormal .mtight}]{.mord .mtight}]{.sizing
    .reset-size6 .size3 .mtight}]{style="top:-2.655em;"}[[]{.pstrut
    style="height:3em;"}[]{.frac-line
    style="border-bottom-width:0.04em;"}]{style="top:-3.23em;"}[[]{.pstrut
    style="height:3em;"}[[[1]{.mord .mtight}]{.mord .mtight}]{.sizing
    .reset-size6 .size3 .mtight}]{style="top:-3.394em;"}]{.vlist
    style="height:0.8451em;"}[​]{.vlist-s}]{.vlist-r}[[]{.vlist
    style="height:0.345em;"}]{.vlist-r}]{.vlist-t
    .vlist-t2}]{.mfrac}[]{.mclose .nulldelimiter}]{.mord}[]{.mspace
    style="margin-right:0.1667em;"}[[∑]{.mop .op-symbol .small-op
    style="position:relative;top:0em;"}[[[[[[]{.pstrut
    style="height:2.7em;"}[[[ij]{.mord .mathnormal .mtight
    style="margin-right:0.05724em;"}]{.mord .mtight}]{.sizing
    .reset-size6 .size3
    .mtight}]{style="top:-2.4003em;margin-left:0em;margin-right:0.05em;"}]{.vlist
    style="height:0.162em;"}[​]{.vlist-s}]{.vlist-r}[[]{.vlist
    style="height:0.4358em;"}]{.vlist-r}]{.vlist-t
    .vlist-t2}]{.msupsub}]{.mop}[]{.mspace
    style="margin-right:0.1667em;"}[[[\[]{.delimsizing .size2}]{.mopen
    .delimcenter style="top:0em;"}[[A]{.mord .mathnormal}[[[[[[]{.pstrut
    style="height:2.7em;"}[[[ij]{.mord .mathnormal .mtight
    style="margin-right:0.05724em;"}]{.mord .mtight}]{.sizing
    .reset-size6 .size3
    .mtight}]{style="top:-2.55em;margin-left:0em;margin-right:0.05em;"}]{.vlist
    style="height:0.3117em;"}[​]{.vlist-s}]{.vlist-r}[[]{.vlist
    style="height:0.2861em;"}]{.vlist-r}]{.vlist-t
    .vlist-t2}]{.msupsub}]{.mord}[]{.mspace
    style="margin-right:0.2222em;"}[−]{.mbin}[]{.mspace
    style="margin-right:0.2222em;"}[[]{.mopen
    .nulldelimiter}[[[[[[]{.pstrut style="height:3em;"}[[[2]{.mord
    .mtight}[m]{.mord .mathnormal .mtight}]{.mord .mtight}]{.sizing
    .reset-size6 .size3 .mtight}]{style="top:-2.655em;"}[[]{.pstrut
    style="height:3em;"}[]{.frac-line
    style="border-bottom-width:0.04em;"}]{style="top:-3.23em;"}[[]{.pstrut
    style="height:3em;"}[[[[k]{.mord .mathnormal .mtight
    style="margin-right:0.03148em;"}[[[[[[]{.pstrut
    style="height:2.5em;"}[[i]{.mord .mathnormal .mtight}]{.sizing
    .reset-size3 .size1
    .mtight}]{style="top:-2.357em;margin-left:-0.0315em;margin-right:0.0714em;"}]{.vlist
    style="height:0.3281em;"}[​]{.vlist-s}]{.vlist-r}[[]{.vlist
    style="height:0.143em;"}]{.vlist-r}]{.vlist-t
    .vlist-t2}]{.msupsub}]{.mord .mtight}[[k]{.mord .mathnormal .mtight
    style="margin-right:0.03148em;"}[[[[[[]{.pstrut
    style="height:2.5em;"}[[j]{.mord .mathnormal .mtight
    style="margin-right:0.05724em;"}]{.sizing .reset-size3 .size1
    .mtight}]{style="top:-2.357em;margin-left:-0.0315em;margin-right:0.0714em;"}]{.vlist
    style="height:0.3281em;"}[​]{.vlist-s}]{.vlist-r}[[]{.vlist
    style="height:0.2819em;"}]{.vlist-r}]{.vlist-t
    .vlist-t2}]{.msupsub}]{.mord .mtight}]{.mord .mtight}]{.sizing
    .reset-size6 .size3 .mtight}]{style="top:-3.5073em;"}]{.vlist
    style="height:0.9934em;"}[​]{.vlist-s}]{.vlist-r}[[]{.vlist
    style="height:0.345em;"}]{.vlist-r}]{.vlist-t
    .vlist-t2}]{.mfrac}[]{.mclose
    .nulldelimiter}]{.mord}[[\]]{.delimsizing .size2}]{.mclose
    .delimcenter style="top:0em;"}]{.minner}[]{.mspace
    style="margin-right:0.1667em;"}[δ]{.mord .mathnormal
    style="margin-right:0.03785em;"}[(]{.mopen}[[c]{.mord
    .mathnormal}[[[[[[]{.pstrut style="height:2.7em;"}[[i]{.mord
    .mathnormal .mtight}]{.sizing .reset-size6 .size3
    .mtight}]{style="top:-2.55em;margin-left:0em;margin-right:0.05em;"}]{.vlist
    style="height:0.3117em;"}[​]{.vlist-s}]{.vlist-r}[[]{.vlist
    style="height:0.15em;"}]{.vlist-r}]{.vlist-t
    .vlist-t2}]{.msupsub}]{.mord}[,]{.mpunct}[]{.mspace
    style="margin-right:0.1667em;"}[[c]{.mord
    .mathnormal}[[[[[[]{.pstrut style="height:2.7em;"}[[j]{.mord
    .mathnormal .mtight style="margin-right:0.05724em;"}]{.sizing
    .reset-size6 .size3
    .mtight}]{style="top:-2.55em;margin-left:0em;margin-right:0.05em;"}]{.vlist
    style="height:0.3117em;"}[​]{.vlist-s}]{.vlist-r}[[]{.vlist
    style="height:0.2861em;"}]{.vlist-r}]{.vlist-t
    .vlist-t2}]{.msupsub}]{.mord}[)]{.mclose}]{.base}]{.katex-html
    aria-hidden="true"}]{.katex} where
    [[$A_{ij}$]{.katex-mathml}[[[]{.strut
    style="height:0.9694em;vertical-align:-0.2861em;"}[[A]{.mord
    .mathnormal}[[[[[[]{.pstrut style="height:2.7em;"}[[[ij]{.mord
    .mathnormal .mtight style="margin-right:0.05724em;"}]{.mord
    .mtight}]{.sizing .reset-size6 .size3
    .mtight}]{style="top:-2.55em;margin-left:0em;margin-right:0.05em;"}]{.vlist
    style="height:0.3117em;"}[​]{.vlist-s}]{.vlist-r}[[]{.vlist
    style="height:0.2861em;"}]{.vlist-r}]{.vlist-t
    .vlist-t2}]{.msupsub}]{.mord}]{.base}]{.katex-html
    aria-hidden="true"}]{.katex} is the adjacency matrix,
    [[$k_{i}$]{.katex-mathml}[[[]{.strut
    style="height:0.8444em;vertical-align:-0.15em;"}[[k]{.mord
    .mathnormal style="margin-right:0.03148em;"}[[[[[[]{.pstrut
    style="height:2.7em;"}[[i]{.mord .mathnormal .mtight}]{.sizing
    .reset-size6 .size3
    .mtight}]{style="top:-2.55em;margin-left:-0.0315em;margin-right:0.05em;"}]{.vlist
    style="height:0.3117em;"}[​]{.vlist-s}]{.vlist-r}[[]{.vlist
    style="height:0.15em;"}]{.vlist-r}]{.vlist-t
    .vlist-t2}]{.msupsub}]{.mord}]{.base}]{.katex-html
    aria-hidden="true"}]{.katex} is node degree,
    [[$m$]{.katex-mathml}[[[]{.strut style="height:0.4306em;"}[m]{.mord
    .mathnormal}]{.base}]{.katex-html aria-hidden="true"}]{.katex} is
    total edges, and [[$\delta(c_{i},c_{j})$]{.katex-mathml}[[[]{.strut
    style="height:1.0361em;vertical-align:-0.2861em;"}[δ]{.mord
    .mathnormal style="margin-right:0.03785em;"}[(]{.mopen}[[c]{.mord
    .mathnormal}[[[[[[]{.pstrut style="height:2.7em;"}[[i]{.mord
    .mathnormal .mtight}]{.sizing .reset-size6 .size3
    .mtight}]{style="top:-2.55em;margin-left:0em;margin-right:0.05em;"}]{.vlist
    style="height:0.3117em;"}[​]{.vlist-s}]{.vlist-r}[[]{.vlist
    style="height:0.15em;"}]{.vlist-r}]{.vlist-t
    .vlist-t2}]{.msupsub}]{.mord}[,]{.mpunct}[]{.mspace
    style="margin-right:0.1667em;"}[[c]{.mord
    .mathnormal}[[[[[[]{.pstrut style="height:2.7em;"}[[j]{.mord
    .mathnormal .mtight style="margin-right:0.05724em;"}]{.sizing
    .reset-size6 .size3
    .mtight}]{style="top:-2.55em;margin-left:0em;margin-right:0.05em;"}]{.vlist
    style="height:0.3117em;"}[​]{.vlist-s}]{.vlist-r}[[]{.vlist
    style="height:0.2861em;"}]{.vlist-r}]{.vlist-t
    .vlist-t2}]{.msupsub}]{.mord}[)]{.mclose}]{.base}]{.katex-html
    aria-hidden="true"}]{.katex} equals 1 if nodes
    [[$i$]{.katex-mathml}[[[]{.strut style="height:0.6595em;"}[i]{.mord
    .mathnormal}]{.base}]{.katex-html aria-hidden="true"}]{.katex} and
    [[$j$]{.katex-mathml}[[[]{.strut
    style="height:0.854em;vertical-align:-0.1944em;"}[j]{.mord
    .mathnormal style="margin-right:0.05724em;"}]{.base}]{.katex-html
    aria-hidden="true"}]{.katex} share a community.

[^3]: Leiden algorithm with resolution γ = 2.0 was used.

[^4]: Betweenness centrality
    [[$C_{B}(v) = \sum_{s \neq v \neq t}\frac{\sigma_{st}(v)}{\sigma_{st}}$]{.katex-mathml}[[[]{.strut
    style="height:1em;vertical-align:-0.25em;"}[[C]{.mord .mathnormal
    style="margin-right:0.07153em;"}[[[[[[]{.pstrut
    style="height:2.7em;"}[[B]{.mord .mathnormal .mtight
    style="margin-right:0.05017em;"}]{.sizing .reset-size6 .size3
    .mtight}]{style="top:-2.55em;margin-left:-0.0715em;margin-right:0.05em;"}]{.vlist
    style="height:0.3283em;"}[​]{.vlist-s}]{.vlist-r}[[]{.vlist
    style="height:0.15em;"}]{.vlist-r}]{.vlist-t
    .vlist-t2}]{.msupsub}]{.mord}[(]{.mopen}[v]{.mord .mathnormal
    style="margin-right:0.03588em;"}[)]{.mclose}[]{.mspace
    style="margin-right:0.2778em;"}[=]{.mrel}[]{.mspace
    style="margin-right:0.2778em;"}]{.base}[[]{.strut
    style="height:1.4551em;vertical-align:-0.4451em;"}[[∑]{.mop
    .op-symbol .small-op
    style="position:relative;top:0em;"}[[[[[[]{.pstrut
    style="height:2.7em;"}[[[s]{.mord .mathnormal .mtight}[[[[[[]{.strut
    style="height:0.8889em;vertical-align:-0.1944em;"}[[[]{.mrel
    .mtight}]{.mord .mtight}]{.inner}[]{.fix}]{.rlap .mtight}]{.thinbox
    .mtight}]{.mord .vbox .mtight}]{.mrel .mtight}[=]{.mrel
    .mtight}]{.mrel .mtight}[v]{.mord .mathnormal .mtight
    style="margin-right:0.03588em;"}[[[[[[]{.strut
    style="height:0.8889em;vertical-align:-0.1944em;"}[[[]{.mrel
    .mtight}]{.mord .mtight}]{.inner}[]{.fix}]{.rlap .mtight}]{.thinbox
    .mtight}]{.mord .vbox .mtight}]{.mrel .mtight}[=]{.mrel
    .mtight}]{.mrel .mtight}[t]{.mord .mathnormal .mtight}]{.mord
    .mtight}]{.sizing .reset-size6 .size3
    .mtight}]{style="top:-2.4003em;margin-left:0em;margin-right:0.05em;"}]{.vlist
    style="height:0.1864em;"}[​]{.vlist-s}]{.vlist-r}[[]{.vlist
    style="height:0.4358em;"}]{.vlist-r}]{.vlist-t
    .vlist-t2}]{.msupsub}]{.mop}[]{.mspace
    style="margin-right:0.1667em;"}[[]{.mopen
    .nulldelimiter}[[[[[[]{.pstrut style="height:3em;"}[[[[σ]{.mord
    .mathnormal .mtight style="margin-right:0.03588em;"}[[[[[[]{.pstrut
    style="height:2.5em;"}[[[s]{.mord .mathnormal .mtight}[t]{.mord
    .mathnormal .mtight}]{.mord .mtight}]{.sizing .reset-size3 .size1
    .mtight}]{style="top:-2.357em;margin-left:-0.0359em;margin-right:0.0714em;"}]{.vlist
    style="height:0.2963em;"}[​]{.vlist-s}]{.vlist-r}[[]{.vlist
    style="height:0.143em;"}]{.vlist-r}]{.vlist-t
    .vlist-t2}]{.msupsub}]{.mord .mtight}]{.mord .mtight}]{.sizing
    .reset-size6 .size3 .mtight}]{style="top:-2.655em;"}[[]{.pstrut
    style="height:3em;"}[]{.frac-line
    style="border-bottom-width:0.04em;"}]{style="top:-3.23em;"}[[]{.pstrut
    style="height:3em;"}[[[[σ]{.mord .mathnormal .mtight
    style="margin-right:0.03588em;"}[[[[[[]{.pstrut
    style="height:2.5em;"}[[[s]{.mord .mathnormal .mtight}[t]{.mord
    .mathnormal .mtight}]{.mord .mtight}]{.sizing .reset-size3 .size1
    .mtight}]{style="top:-2.357em;margin-left:-0.0359em;margin-right:0.0714em;"}]{.vlist
    style="height:0.2963em;"}[​]{.vlist-s}]{.vlist-r}[[]{.vlist
    style="height:0.143em;"}]{.vlist-r}]{.vlist-t
    .vlist-t2}]{.msupsub}]{.mord .mtight}[(]{.mopen .mtight}[v]{.mord
    .mathnormal .mtight style="margin-right:0.03588em;"}[)]{.mclose
    .mtight}]{.mord .mtight}]{.sizing .reset-size6 .size3
    .mtight}]{style="top:-3.485em;"}]{.vlist
    style="height:1.01em;"}[​]{.vlist-s}]{.vlist-r}[[]{.vlist
    style="height:0.4451em;"}]{.vlist-r}]{.vlist-t
    .vlist-t2}]{.mfrac}[]{.mclose
    .nulldelimiter}]{.mord}]{.base}]{.katex-html
    aria-hidden="true"}]{.katex} where
    [[$\sigma_{st}$]{.katex-mathml}[[[]{.strut
    style="height:0.5806em;vertical-align:-0.15em;"}[[σ]{.mord
    .mathnormal style="margin-right:0.03588em;"}[[[[[[]{.pstrut
    style="height:2.7em;"}[[[s]{.mord .mathnormal .mtight}[t]{.mord
    .mathnormal .mtight}]{.mord .mtight}]{.sizing .reset-size6 .size3
    .mtight}]{style="top:-2.55em;margin-left:-0.0359em;margin-right:0.05em;"}]{.vlist
    style="height:0.2806em;"}[​]{.vlist-s}]{.vlist-r}[[]{.vlist
    style="height:0.15em;"}]{.vlist-r}]{.vlist-t
    .vlist-t2}]{.msupsub}]{.mord}]{.base}]{.katex-html
    aria-hidden="true"}]{.katex} is the number of shortest paths between
    nodes [[$s$]{.katex-mathml}[[[]{.strut
    style="height:0.4306em;"}[s]{.mord .mathnormal}]{.base}]{.katex-html
    aria-hidden="true"}]{.katex} and [[$t$]{.katex-mathml}[[[]{.strut
    style="height:0.6151em;"}[t]{.mord .mathnormal}]{.base}]{.katex-html
    aria-hidden="true"}]{.katex}, and
    [[$\sigma_{st}(v)$]{.katex-mathml}[[[]{.strut
    style="height:1em;vertical-align:-0.25em;"}[[σ]{.mord .mathnormal
    style="margin-right:0.03588em;"}[[[[[[]{.pstrut
    style="height:2.7em;"}[[[s]{.mord .mathnormal .mtight}[t]{.mord
    .mathnormal .mtight}]{.mord .mtight}]{.sizing .reset-size6 .size3
    .mtight}]{style="top:-2.55em;margin-left:-0.0359em;margin-right:0.05em;"}]{.vlist
    style="height:0.2806em;"}[​]{.vlist-s}]{.vlist-r}[[]{.vlist
    style="height:0.15em;"}]{.vlist-r}]{.vlist-t
    .vlist-t2}]{.msupsub}]{.mord}[(]{.mopen}[v]{.mord .mathnormal
    style="margin-right:0.03588em;"}[)]{.mclose}]{.base}]{.katex-html
    aria-hidden="true"}]{.katex} is the number passing through
    [[$v$]{.katex-mathml}[[[]{.strut style="height:0.4306em;"}[v]{.mord
    .mathnormal style="margin-right:0.03588em;"}]{.base}]{.katex-html
    aria-hidden="true"}]{.katex}.
