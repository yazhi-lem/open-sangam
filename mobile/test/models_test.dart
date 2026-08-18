import 'package:flutter_test/flutter_test.dart';
import 'package:sangam_chat/models/message.dart';
import 'package:sangam_chat/models/sangam_agent.dart';
import 'package:sangam_chat/models/verse.dart';
import 'package:sangam_chat/models/poem.dart';

void main() {
  group('SangamAgent', () {
    test('has all five agents', () {
      expect(SangamAgent.values.length, 5);
    });

    test('fromId returns correct agent', () {
      expect(SangamAgent.fromId('nakkirar'), SangamAgent.nakkirar);
      expect(SangamAgent.fromId('avvaiyar'), SangamAgent.avvaiyar);
      expect(SangamAgent.fromId('kapilar'), SangamAgent.kapilar);
      expect(SangamAgent.fromId('tholkappiyar'), SangamAgent.tholkappiyar);
      expect(SangamAgent.fromId('english_scholar'), SangamAgent.englishScholar);
    });

    test('fromId defaults to nakkirar for unknown', () {
      expect(SangamAgent.fromId('unknown'), SangamAgent.nakkirar);
    });
  });

  group('Citation', () {
    test('parses from JSON', () {
      final c = Citation.fromJson({
        'verse_id': 'kurunthokai_100',
        'poem': 'kurunthokai',
        'tinai': 'kurinji',
        'poet': 'கபிலர்',
      });
      expect(c.verseId, 'kurunthokai_100');
      expect(c.poem, 'kurunthokai');
      expect(c.tinai, 'kurinji');
    });
  });

  group('AskRequest', () {
    test('serializes to JSON', () {
      const req = AskRequest(
        message: 'What is kurinji?',
        agent: 'english_scholar',
      );
      final json = req.toJson();
      expect(json['message'], 'What is kurinji?');
      expect(json['agent'], 'english_scholar');
      expect(json['workflow'], 'qa');
    });
  });

  group('AskResponse', () {
    test('parses from JSON', () {
      final res = AskResponse.fromJson({
        'session_id': 'sess-123',
        'workflow': 'qa',
        'poet': 'nakkirar',
        'response_text': 'Kurinji is the mountain tiṇai.',
        'citations': [
          {'verse_id': 'kurunthokai_100', 'tinai': 'kurinji'},
        ],
        'metadata': {
          'model': 'openrouter:gemini-2.5-flash',
          'elapsed_ms': 1234,
          'timestamp': '2026-01-01T00:00:00Z',
        },
      });
      expect(res.sessionId, 'sess-123');
      expect(res.poet, 'nakkirar');
      expect(res.citations.length, 1);
      expect(res.metadata?.elapsedMs, 1234);
    });
  });

  group('Verse', () {
    test('parses from JSON', () {
      final v = Verse.fromJson({
        'id': 'kurunthokai_100',
        'poem': 'kurunthokai',
        'number': 100,
        'tinai': 'kurinji',
        'sangamTamil': 'மலர் விரி தோடு...',
        'urai': 'மலர்கள் விரிந்த தோட்டத்தில்...',
        'lines': [],
      });
      expect(v.id, 'kurunthokai_100');
      expect(v.number, 100);
      expect(v.tinai, 'kurinji');
    });
  });

  group('PoemRegistry', () {
    test('parses from JSON', () {
      final p = PoemRegistry.fromJson({
        'id': 'natrinai',
        'ta': 'நற்றிணை',
        'en': 'Natrinai',
        'collection': '8thokai',
        'count': 400,
        'unit': 'poems',
        'available': true,
        'tinai': ['kurinji', 'mullai'],
      });
      expect(p.id, 'natrinai');
      expect(p.tamilName, 'நற்றிணை');
      expect(p.count, 400);
      expect(p.tinai.length, 2);
    });
  });
}
