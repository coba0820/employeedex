CREATE TABLE IF NOT EXISTS employees (
  id TEXT PRIMARY KEY,
  number TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL DEFAULT '',
  nickname TEXT NOT NULL DEFAULT '',
  photo TEXT NOT NULL DEFAULT '',
  department TEXT NOT NULL DEFAULT '',
  position TEXT NOT NULL DEFAULT '',
  job_description TEXT NOT NULL DEFAULT '',
  gender TEXT NOT NULL DEFAULT '',
  birth_date TEXT NOT NULL DEFAULT '',
  area TEXT NOT NULL DEFAULT '',
  join_date TEXT NOT NULL DEFAULT '',
  catchphrase TEXT NOT NULL DEFAULT '',
  mbti TEXT NOT NULL DEFAULT '',
  love_mbti TEXT NOT NULL DEFAULT '',
  strengths TEXT NOT NULL DEFAULT '',
  weaknesses TEXT NOT NULL DEFAULT '',
  hobby TEXT NOT NULL DEFAULT '',
  favorites TEXT NOT NULL DEFAULT '',
  work_style TEXT NOT NULL DEFAULT '',
  personality_type TEXT NOT NULL DEFAULT '',
  character_in_office TEXT NOT NULL DEFAULT '',
  free_comment TEXT NOT NULL DEFAULT '',
  rarity TEXT NOT NULL DEFAULT 'N',
  card_type TEXT NOT NULL DEFAULT '',
  tags TEXT NOT NULL DEFAULT '[]',
  stats TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS favorite_employees (
  client_id TEXT NOT NULL,
  employee_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (client_id, employee_id)
);

CREATE INDEX IF NOT EXISTS idx_employees_number ON employees(number);
CREATE INDEX IF NOT EXISTS idx_favorite_employees_client ON favorite_employees(client_id, created_at);

INSERT OR IGNORE INTO app_settings (key, value) VALUES
('masters', '{"departments":[{"id":"sales","name":"営業部","color":"#3B82F6"},{"id":"marketing","name":"マーケティング部","color":"#EC4899"},{"id":"engineering","name":"開発部","color":"#10B981"},{"id":"design","name":"デザイン部","color":"#8B5CF6"},{"id":"management","name":"経営企画部","color":"#6366F1"},{"id":"hr","name":"人事部","color":"#F59E0B"},{"id":"support","name":"カスタマーサクセス部","color":"#06B6D4"},{"id":"executive","name":"役員","color":"#D4AF37"}],"rarities":[{"id":"N","label":"N","name":"ノーマル","order":1,"color":"#9CA3AF","gradient":["#E5E7EB","#9CA3AF"]},{"id":"R","label":"R","name":"レア","order":2,"color":"#3B82F6","gradient":["#BFDBFE","#3B82F6"]},{"id":"SR","label":"SR","name":"スーパーレア","order":3,"color":"#8B5CF6","gradient":["#DDD6FE","#7C3AED"]},{"id":"SSR","label":"SSR","name":"スーパースペシャルレア","order":4,"color":"#F59E0B","gradient":["#FDE68A","#F59E0B"]},{"id":"UR","label":"UR","name":"ウルトラレア","order":5,"color":"#EF4444","gradient":["#FCA5A5","#DC2626","#7C3AED"]},{"id":"Legend","label":"LEGEND","name":"レジェンド","order":6,"color":"#D4AF37","gradient":["#FFF7CC","#D4AF37","#7C3AED","#111827"]}],"cardTypes":[{"id":"sales_type","name":"営業タイプ","icon":"fa-handshake"},{"id":"planner_type","name":"企画タイプ","icon":"fa-lightbulb"},{"id":"analyst_type","name":"分析タイプ","icon":"fa-chart-line"},{"id":"mood_maker","name":"ムードメーカー","icon":"fa-face-laugh-beam"},{"id":"craftsman","name":"職人タイプ","icon":"fa-screwdriver-wrench"},{"id":"creator","name":"クリエイター","icon":"fa-palette"},{"id":"commander","name":"司令塔","icon":"fa-chess-king"},{"id":"challenger","name":"チャレンジャー","icon":"fa-fire"}],"tags":[{"id":"keiba","emoji":"🏇","label":"競馬好き"},{"id":"coffee","emoji":"☕","label":"コーヒー好き"},{"id":"ramen","emoji":"🍜","label":"ラーメン部"},{"id":"golf","emoji":"🏌️","label":"ゴルフ"},{"id":"soccer","emoji":"⚽","label":"サッカー"},{"id":"game","emoji":"🎮","label":"ゲーム"},{"id":"sake","emoji":"🍺","label":"お酒"},{"id":"camera","emoji":"📷","label":"カメラ"},{"id":"fishing","emoji":"🎣","label":"釣り"},{"id":"ai","emoji":"💻","label":"AI"},{"id":"design_tag","emoji":"🎨","label":"デザイン"},{"id":"marketing_tag","emoji":"📊","label":"マーケティング"},{"id":"training","emoji":"💪","label":"筋トレ"},{"id":"movie","emoji":"🎬","label":"映画好き"},{"id":"travel","emoji":"✈️","label":"旅行好き"},{"id":"music","emoji":"🎵","label":"音楽"},{"id":"pet","emoji":"🐶","label":"ペット"},{"id":"sweets","emoji":"🍰","label":"スイーツ"}],"mbtiOptions":["INTJ","INTP","ENTJ","ENTP","INFJ","INFP","ENFJ","ENFP","ISTJ","ISFJ","ESTJ","ESFJ","ISTP","ISFP","ESTP","ESFP"],"genderOptions":["男性","女性","回答しない"],"mbtiInfo":{"INTJ":"建築家","INTP":"論理学者","ENTJ":"指揮官","ENTP":"討論者","INFJ":"提唱者","INFP":"仲介者","ENFJ":"主人公","ENFP":"広報運動家","ISTJ":"管理者","ISFJ":"擁護者","ESTJ":"幹部","ESFJ":"領事官","ISTP":"巨匠","ISFP":"冒険家","ESTP":"起業家","ESFP":"エンターテイナー"},"statLabels":[{"id":"comm","name":"コミュ力"},{"id":"action","name":"行動力"},{"id":"planning","name":"企画力"},{"id":"analysis","name":"分析力"},{"id":"idea","name":"発想力"},{"id":"leadership","name":"リーダー力"}]}');

INSERT OR IGNORE INTO employees (
  id, number, name, nickname, photo, department, position, job_description,
  gender, birth_date, area, join_date, catchphrase, mbti, love_mbti,
  strengths, weaknesses, hobby, favorites, work_style, personality_type,
  character_in_office, free_comment, rarity, card_type, tags, stats
) VALUES
('emp001', 'No.001', '佐藤 直樹', 'なおきさん', '/static/images/employees/001.png', 'sales', '営業部 課長', '法人営業・大口顧客担当', '男性', '1992-05-14', '東京都 世田谷区', '2019-04-01', '「頼れる」を、仕事にしてる。', 'ESTJ', 'ISFJ', '初対面の距離を一瞬で詰めること、クレーム対応', '細かい書類仕事、パソコンのショートカット操作', 'ゴルフ、サウナ巡り', 'コンビニのコーヒー、行きつけの立ち飲み屋', '現場主義。とにかく客先に足を運ぶタイプ。', '熱血リーダー気質', '新人が困っていると誰よりも先に気づいて声をかける、社内のお兄さん的存在。', '数字は嘘つかない、けど人はもっと嘘つかない。だから人を見てます。', 'SR', 'sales_type', '["golf","sake","keiba"]', '{"comm":5,"action":5,"planning":3,"analysis":3,"idea":3,"leadership":4}'),
('emp002', 'No.002', '鈴木 美咲', 'みさきち', '/static/images/employees/002.png', 'marketing', 'マーケティング部 主任', 'SNSマーケティング・イベント企画', '女性', '1996-09-02', '神奈川県 横浜市', '2022-10-01', 'バズらせるより、好きになってもらう派。', 'ENFP', 'INTJ', '企画のアイデア出し、雑談からトレンドを見つける嗅覚', 'スケジュール管理、朝が弱い', 'カフェ巡り、韓国ドラマ鑑賞', '抹茶ラテ、季節限定スイーツ', '思いついたら即行動。まず手を動かしてから考える。', '自由奔放なムードメーカー', 'オフィスの雑談を盛り上げる中心人物。誕生日サプライズの発起人はだいたい彼女。', '「とりあえずやってみよう」で始まったプロジェクト、意外と成功してます。', 'R', 'mood_maker', '["sweets","coffee","travel"]', '{"comm":5,"action":4,"planning":4,"analysis":2,"idea":5,"leadership":3}'),
('emp003', 'No.003', '高橋 健太', 'けんてぃ', '/static/images/employees/003.png', 'engineering', '開発部 エンジニア', 'バックエンド開発・社内システム保守', '男性', '1997-01-20', '東京都 江東区', '2021-04-01', '静かに、確実に、バグを潰す男。', 'INTP', 'ENFJ', '地道なデバッグ作業、新しい技術のキャッチアップ', '大人数での雑談、電話対応', '自作PC、競技プログラミング', 'エナジードリンク、深夜ラジオ', '一人で集中できる時間を確保してから一気に片付ける。', '寡黙な職人気質', '困った時に聞くと必ず助けてくれる、社内Wikipedia的存在。イヤホンをしていたら話しかけるタイミングに注意。', 'コードは裏切らない。人間はたまに裏切る（自戒を込めて）。', 'R', 'craftsman', '["ai","game","music"]', '{"comm":2,"action":3,"planning":3,"analysis":5,"idea":4,"leadership":2}'),
('emp004', 'No.004', '田中 彩花', 'あやぴょん', '/static/images/employees/004.png', 'design', 'デザイン部 デザイナー', 'UI/UXデザイン・ブランディング', '女性', '1999-03-11', '東京都 中野区', '2023-04-01', '細部に宿る、こだわりの1px。', 'INFP', 'ENTP', '配色センス、細部への気配り', '決断の速さ、優先順位づけ', '美術館巡り、イラスト制作', '限定コラボグッズ、こだわりの文房具', 'とことん納得いくまで手を止めない、こだわり派。', '繊細な感受性を持つ表現者', '打ち合わせ中にふと出るアイデアスケッチがいつも秀逸で、みんなをうならせる。', '『なんか違う』を言語化するのが得意です。', 'SR', 'creator', '["design_tag","camera","sweets"]', '{"comm":3,"action":3,"planning":4,"analysis":3,"idea":5,"leadership":2}'),
('emp005', 'No.005', '伊藤 誠', 'マコさん', '/static/images/employees/005.png', 'management', '経営企画部 マネージャー', '経営戦略・データ分析', '男性', '1988-11-30', '東京都 港区', '2015-04-01', '感情より、まず数字を見せてくれ。', 'INTJ', 'ENFP', 'データ分析、論理的なプレゼン構成', '雑談で盛り上がること、思いつきの提案への即答', '投資の勉強、将棋', 'ブラックコーヒー、経済ニュース', '感覚より数字。まず仮説を立ててから検証する。', '冷静沈着な戦略家', '会議で誰も突っ込めなかった穴を静かに一言で指摘する、社内の最終ボス的存在。', '正論だけじゃ人は動かない、というのが最近の学び。', 'UR', 'analyst_type', '["ai","keiba","coffee"]', '{"comm":3,"action":3,"planning":5,"analysis":5,"idea":3,"leadership":4}'),
('emp006', 'No.006', '山本 蓮', 'れんくん', '/static/images/employees/006.png', 'sales', '営業部 メンバー', '新規開拓営業', '男性', '2000-06-18', '埼玉県 さいたま市', '2024-04-01', '断られてからが、本当のスタート。', 'ESFP', 'INFJ', 'テレアポの粘り強さ、失敗を引きずらないメンタル', '資料作成、期限ギリギリの追い込み', 'フットサル、キャンプ', '焼肉、エナドリ', 'とにかく行動量で勝負。断られても翌日にはケロッとしている。', '元気印のチャレンジャー', '新人ながら誰よりも大きな声で挨拶する。失敗談を笑い話にできるムードメーカー候補生。', '3年後には自分の名前で仕事を取れるようになりたいです！', 'N', 'challenger', '["soccer","training","sake"]', '{"comm":4,"action":5,"planning":2,"analysis":2,"idea":3,"leadership":3}'),
('emp007', 'No.007', '中村 由美', 'ゆみさん', '/static/images/employees/007.png', 'hr', '人事部 部長', '採用戦略・組織開発', '女性', '1985-02-08', '東京都 杉並区', '2012-04-01', '人が育つ会社は、いい会社。', 'ENFJ', 'INTP', '傾聴力、面接での本音の引き出し方', '自分の話をすること、パソコンの新しいツール操作', 'ヨガ、読書', 'ハーブティー、手帳とペン', '一人ひとりとしっかり向き合う。効率より納得感を大事にする。', '包容力のある人格者', 'この会社の歴史をほぼ全部知っている生き字引。新入社員の相談窓口は大体この人。', 'この図鑑を作ろうと言い出したのは、実は私です。', 'SSR', 'commander', '["pet","movie","coffee"]', '{"comm":5,"action":3,"planning":4,"analysis":3,"idea":3,"leadership":5}'),
('emp008', 'No.008', '渡辺 翔太', 'しょうた', '/static/images/employees/008.png', 'design', 'デザイン部 クリエイター', '動画制作・グラフィックデザイン', '男性', '2002-12-25', '東京都 渋谷区', '2025-04-01', 'つくることでしか、証明できない。', 'ISFP', 'ESTJ', '最新トレンドのキャッチアップ、動画編集の速さ', '早起き、定例報告', '映画鑑賞、DJ機材いじり', '古着、レコード', '深夜に集中力が高まるタイプ。締切前の爆発力がすごい。', '感性で動くアーティスト', '私服がいつもおしゃれで、社内の若手のファッションアイコン的存在。', '会社の紹介動画、いつか自分で全部作りたいです。', 'R', 'creator', '["music","camera","movie"]', '{"comm":3,"action":3,"planning":3,"analysis":2,"idea":5,"leadership":2}'),
('emp009', 'No.009', '小林 あゆみ', 'あゆあゆ', '/static/images/employees/009.png', 'support', 'カスタマーサクセス部 リーダー', '顧客サポート・オンボーディング', '女性', '1994-07-07', '千葉県 船橋市', '2020-04-01', '『困った』に、いちばん早く気づく人。', 'ISFJ', 'ESFP', '丁寧なヒアリング、クレームを笑顔で受け止める力', '自分を後回しにしすぎること、ノーと言うこと', 'お菓子作り、犬の散歩', '焼き菓子、あたたかい紅茶', 'お客様の立場になって考える。急かされても丁寧さを崩さない。', '献身的なサポーター', '誰かが落ち込んでいると気づいてそっとお菓子を差し入れてくれる、社内の癒し担当。', 'ありがとうって言われる瞬間のために働いてます。', 'R', 'mood_maker', '["pet","sweets","coffee"]', '{"comm":4,"action":3,"planning":3,"analysis":3,"idea":3,"leadership":3}'),
('emp010', 'No.010', '加藤 幸一', '会長', '/static/images/employees/010.png', 'executive', '代表取締役社長', '経営全般・対外交渉', '男性', '1975-04-01', '東京都 千代田区', '2005-04-01', 'この会社は、社員という名の宝物でできている。', 'ENTJ', 'INFP', '決断力、修羅場での冷静さ', 'スマホの新しいアプリ操作、細かい経費精算', 'ゴルフ、日本酒の利き酒', '日本酒、社員全員の名前と顔', '現場に口を出しすぎない。任せて、責任は自分で取る。', '器の大きい創業者タイプ', 'エレベーターで会うと必ず名前で挨拶してくれる。実はこの社員図鑑を一番楽しみにしている。', '君のカード、まだ見てないな。今度見せてくれ。', 'Legend', 'commander', '["golf","sake","keiba"]', '{"comm":5,"action":4,"planning":5,"analysis":4,"leadership":5,"idea":4}');
