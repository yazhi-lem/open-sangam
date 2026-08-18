/// Sangam agent selector — which poet agent to route chat messages to.
library;

enum SangamAgent {
  nakkirar(
    id: 'nakkirar',
    tamilName: 'நக்கீரர்',
    englishName: 'Nakkirar',
    description: 'Convener — general Q&A about Sangam literature',
  ),
  avvaiyar(
    id: 'avvaiyar',
    tamilName: 'ஔவையார்',
    englishName: 'Avvaiyar',
    description: 'Q&A specialist — detailed verse and poet analysis',
  ),
  kapilar(
    id: 'kapilar',
    tamilName: 'கபிலர்',
    englishName: 'Kapilar',
    description: 'Search & retrieval — finding verses by theme',
  ),
  tholkappiyar(
    id: 'tholkappiyar',
    tamilName: 'தொல்காப்பியர்',
    englishName: 'Tholkappiyar',
    description: 'Scenario extraction — structured literary analysis',
  ),
  englishScholar(
    id: 'english_scholar',
    tamilName: 'English Scholar',
    englishName: 'English Scholar',
    description: 'British Tamil scholarship — translation history & cross-cultural context',
  );

  const SangamAgent({
    required this.id,
    required this.tamilName,
    required this.englishName,
    required this.description,
  });

  /// The wire identifier sent to the API.
  final String id;

  /// Tamil name for display.
  final String tamilName;

  /// English name for display.
  final String englishName;

  /// Short description shown in agent selector.
  final String description;

  /// Find agent by its API id string.
  static SangamAgent fromId(String id) {
    return SangamAgent.values.firstWhere(
      (a) => a.id == id,
      orElse: () => SangamAgent.nakkirar,
    );
  }
}
