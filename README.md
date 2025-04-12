# ![logo](https://github.com/user-attachments/assets/60797f7e-03c6-4ea6-9da1-81aa99d81e2c)


## 🎯 企画の背景と問題

私たちは、**自分から遊びに誘うのが苦手な人でも、気軽に友達を誘えるアプリ**を作りたいと考えました。

学生時代や職場など、同じ環境にいる時は仲の良かった友達でも、進学・就職・転職などのライフイベントによって関係が疎遠になってしまうことがあります。  
実際に、**喧嘩別れなどではないのに疎遠になってしまった友人がいる**と答えた人の割合は、800人中86.8%と非常に高い結果が出ています。

では、なぜ「また会いたい」と思っていても、連絡を取らずに疎遠になってしまうのでしょうか？

その理由の一つとして、**遊びに誘うことへの心理的ハードル**があると私たちは考えました。

「自分から友達を誘うのが苦手」と感じている人は約52％。  
その主な理由としては以下のような声がありました：

- 誘うための文章を考えるのが苦手  
- 断られたときに気まずくなるのが嫌  
- 忙しそうな相手に気を遣ってしまう

このような心理的な負担によって、「疎遠になってしまった友達」には特に声をかけづらく、結果として関係が自然に途切れてしまいます。

私たちは、そういった人でも気軽に遊びに誘えるような仕組みを提供し、**再び人と人のつながりを広げること**を目指しています。

---

## 🧩 扱う問題と解決方法

### ❗ 扱う問題
誘いたい気持ちはあるのに、「自分から誘うのが苦手」と感じている人は多くいます。  
その理由としては

- 誘うための文章を考えるのが苦手  
- 断られたら気まずい  
- 忙しそうな相手に気を遣ってしまう

こうした小さな心理的な負担が積み重なり、友人関係の自然な疎遠化へとつながってしまいます。

---

### 💡 解決方法として考えたこと
こうした問題を解決するために、私たちは以下のような機能を考えました。

- **投稿形式での誘い方**  
　→ 個別にメッセージを送るのではなく、誘いたい友達に向けて投稿形式でイベントを作成

- **暇な日カレンダー**  
　→ 相手の空いている日が事前にわかるため、断られる心配が減る

- **やりたいことリスト**  
　→ 「何するか決まってないから誘いづらい…」という状態でも、あらかじめやりたいことを共有できる

これらの機能を通じて、遊びに誘う心理的ハードルを下げ、関係をつなぎ直すきっかけを提供します。



## 🛠️ 使用技術

### 🏗️ フレームワーク  
![React Native](https://img.shields.io/badge/React_Native-61DAFB?style=for-the-badge&logo=react&logoColor=white)

### 🖥️ サーバー  
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)

### 💻 言語  
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)

### 🧰 開発ツール  
![Expo](https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white)

---

## 🧭 スキーマ図

```mermaid
erDiagram
    users {
        uuid id
        varchar username
        date birthdate
        timestamp created_at
        timestamp updated_at
        text bio
        text gender
        uuid icon
        text pushNotificationToken
        timestamp banned_until
        bool is_admin
        text comment
    }

    profiles {
        uuid id
        varchar username
        timestamp created_at
    }

    friends {
        uuid user_id
        uuid friend_id
        text status
        timestamp created_at
        timestamp updated_at
        text attribute1
        text attribute2
    }

    friend_attributes {
        int id
        timestamp created_at
        uuid user_id
        text create_attributes
    }

    events {
        uuid id
        timestamp meeting_time
        date event_date
        timestamp deadline_time
        text meeting_place
        text event_place
        text cost
        int participant_limit
    }

    user_calendar_events {
        uuid id
        uuid user_id
        date date
        text startTime
        text endTime
        text description
        timestamp created_at
    }

    user_reports {
        uuid id
        uuid reported_user_id
        uuid reporter_user_id
        text report_reason
        timestamp reported_at
        timestamp created_at
        bool is_confirmed
    }

    personal_chats {
        uuid id
        uuid host_user_id
        uuid receiver_user_id
        timestamp created_at
    }

    chat_rooms {
        uuid id
        uuid article_id
        timestamp created_at
    }

    chat_room_status {
        int id
        uuid user_id
        bool is_open
        timestamp updated_at
        uuid group_chat_room_id
        uuid personal_chat_room_id
        uuid chat_room_id
    }

    messages {
        uuid id
        uuid chat_room_id
        uuid user_id
        text content
        timestamp created_at
        text read_by_user_ids
        bool is_deleted
    }

    articles {
        uuid id
        varchar title
        text content
        timestamp created_at
        uuid host_user_id
        text meeting_place
        text cost
        int participant_limit
        date event_date
        timestamp deadline_time
        uuid prefecture_id
        uuid city_id
        text participant_ids
        uuid chat_room_id
        date deadline_date
        text meeting_location
        time gathering_time
    }

    comments {
        int id
        text comment
        timestamp created_at
        uuid user_id
    }

    users ||--|| profiles : "has"
    users ||--o{ friends : "has"
    users ||--o{ friend_attributes : "has"
    users ||--o{ user_calendar_events : "has"
    users ||--o{ user_reports : "reports"
    users ||--o{ personal_chats : "chats with"
    users ||--o{ chat_room_status : "has"
    users ||--o{ messages : "writes"
    users ||--o{ articles : "writes"
    users ||--o{ comments : "writes"

    chat_rooms ||--o{ messages : "contains"
    chat_rooms ||--o{ chat_room_status : "tracks"

    articles ||--o{ chat_rooms : "has"
    articles ||--o{ events : "is based on"

    friends ||--o{ friend_attributes : "has"
```

---

## 📱 画面遷移図
```mermaid
flowchart TD;
    %% 初期画面からの流れ
    A["初期画面"] -->|アカウント作成| B["アカウント作成画面"]
    A -->|ログイン| C["ログイン画面"]
    A -->|利用規約| D["利用規約モーダル"]
    B -->|認証メール送信後| C
    C -->|ログイン成功| E["ホーム画面（フレンドのスケジュール確認）"]

    %% ナビゲーションバー
    E -->|チャット| F["チャット画面"]
    E -->|イベント関連| G["イベント関連"]
    E -->|ソーシャル| H["ソーシャル"]
    E -->|ユーザーページ| I["ユーザーページ（自分）"]
    E -->|通知アイコン| J["通知センター"]

    %% チャット画面
    F -->|個人チャット| K["フレンドとの個人チャット"]
    F -->|グループチャット| L["イベントグループチャット"]
    L -->|メッセージ送信| M["メッセージ送信"]
    K -->|メッセージ送信| M2["メッセージ送信"]

    %% 個人チャットの作成（フレンド成立時に自動作成）
    AB["フレンド成立"] -->|自動的に作成| K 

    %% イベント関連
    G -->|イベント一覧| N["イベント一覧"]
    G -->|自分のイベント| O["自分のイベント"]
    G -->|参加中のイベント| P["参加中のイベント"]
    
    %% イベント詳細と参加フロー
    N -->|イベント選択| Q["イベント詳細"]
    Q -->|参加ボタンを押す| R["イベント参加"]
    R -->|ホストに通知が送信される| S["イベント参加通知（通知センター）"]
    R -->|参加イベントリストに追加| P
    R -->|グループチャットに自動参加| T["グループチャット（参加済み）"]
    T -.->|ナビゲーションバーからアクセス| F

    %% ソーシャル（フレンド機能）
    H -->|フレンド一覧| U["フレンド一覧"]
    H -->|フレンド追加| V["フレンド追加"]
    H -->|フレンド保留中/申請中| W["フレンド保留中/申請中"]

    %% フレンド機能（追加・承認）
    V -->|検索| X["ユーザー検索"]
    V -->|QRコード| Y["QRコードスキャン"]
    X -->|ユーザー選択| Z1["ユーザーページ（他人）"]
    Y -->|QRコードスキャン成功| Z1
    Z1 -->|フレンドリクエスト送信| AA["フレンド申請中リスト"]
    W -->|フレンドリクエストを承認| AB
    AB -->|フレンド一覧に追加| U

    %% ユーザーページ（自分）
    I -->|カレンダーの日付を選択| AC["空いている日付・時間の設定"]
    I -->|"やりたいことリスト（未実装）"| AD["未実装"]
    I -->|編集ボタンを押す| AE["プロフィール編集"]
    AE -->|変更を保存| AF["変更を反映"]
    AE -->|ログアウトボタンを押す| A1["初期画面"]

    %% 通知センター
    J -->|フレンドリクエスト承認通知| AG["○○さんがフレンドリクエストを承認しました"]
    J -->|イベント参加者増加通知| AH["○○さんがあなたのイベントに参加しました"]
    J -->|フレンドのイベント作成通知| AI["○○さんが新しいイベントを作成しました"]
```
---

## 📱💻 アプリ画面一覧（スマホ / Web）

### 🚪 ウェルカム画面

アプリ起動時の最初の画面。ログイン・アカウント作成・利用規約に進む。

- ログインボタン → ログイン画面へ  
- アカウント作成ボタン → アカウント作成画面へ  
- 利用規約 → 閲覧のみ可能（モーダル）

<div align="center">

<table>
  <tr>
    <th>📱 スマホ画面</th>
    <th>🖥 Web画面</th>
  </tr>
  <tr>
    <td><img src="https://github.com/user-attachments/assets/353e2b08-a043-46a4-868a-1f24b38c55b6" width="400" /></td>
    <td><img src="https://github.com/user-attachments/assets/7ba2de0c-6532-4c41-a55a-fe87459a6e41" width="1200" /></td>
  </tr>
</table>

</div>

---

### 📝 アカウント作成画面

新規登録用画面。

- ユーザー名、メールアドレス、生年月日、パスワード入力  
- 利用規約の同意が必須  
- アカウント作成 → 認証メール送信  

<div align="center">

<table>
  <tr>
    <th>📱 スマホ画面</th>
    <th>🖥 Web画面</th>
  </tr>
  <tr>
    <td><img src="https://github.com/user-attachments/assets/ec4f83bd-02c7-4b72-afe5-46b6baa8bf43" width="400" /></td>
    <td><img src="https://github.com/user-attachments/assets/6efed23a-2972-44d6-94a1-45affa1bf387" width="1200" /></td>
  </tr>
</table>

</div>

---

### 🔐 ログイン画面

既存ユーザーのログイン用。

- メールアドレス・パスワード入力  
- ログインボタンでホームへ遷移  
- アカウント未作成の場合は作成画面へ

<div align="center">

<table>
  <tr>
    <th>📱 スマホ画面</th>
    <th>🖥 Web画面</th>
  </tr>
  <tr>
    <td><img src="https://github.com/user-attachments/assets/6bee7914-9a86-453e-b258-0684ee33f5b0" width="400" /></td>
    <td><img src="https://github.com/user-attachments/assets/bfffdab7-adfc-4c54-9b0e-4da8d52cb7a9" width="1200" /></td>
  </tr>
</table>

</div>


---

### 🏠 ホーム画面（フレンドのスケジュール確認） ※スマホのみ

- カレンダーでフレンドの空いている日付を一覧表示  
- 色がついている日付をタップすると空き時間を表示

| カレンダー一覧 | → | 日付選択後の空き時間表示 |
|----------------|----|----------------------------|
| <img src="https://github.com/user-attachments/assets/7114e894-5112-4d7c-a4ea-e79f76d974f5" width="220" /> |   |<img src="https://github.com/user-attachments/assets/4ee32156-2298-4626-bb85-5750150b6517" width="220" />

---

### 👥 ソーシャル画面（タブ形式）

#### フレンド一覧タブ

- フレンドの一覧表示  
- 各ユーザーをタップ → 属性割り当てモーダルへ  

<div align="center">

<table>
  <tr>
    <th>📱 スマホ画面</th>
    <th>🖥 Web画面</th>
  </tr>
  <tr>
    <td><img src="https://github.com/user-attachments/assets/5f7bb4d6-49b2-4d66-8a07-8e314f52df13" width="400" /></td>
    <td><img src="https://github.com/user-attachments/assets/588a8ded-e7fa-4d1d-ac95-27c620efd01d" width="1200" /></td>
  </tr>
</table>

</div>


#### フレンド追加タブ

- QRコード or ユーザー検索でフレンド申請  ※QRコードはスマホのみ


<table>
  <tr>
    <th>📱 スマホ画面</th>
  </tr>
  <tr>
    <td><img src="https://github.com/user-attachments/assets/23b9c77d-fa76-4a41-baf5-0e842bfbfb49" width="220" /></td>
  </tr>
</table>

</div>

#### 📷 QRコード表示モーダル

- 自分のプロフィールページQRコードを表示  
- 相手が読み取ることで申請可能  

#### 🔍 ユーザー検索

- 入力欄からリクエストを送信したいユーザー名を入力
- 表示されたユーザーを選択することでユーザーページ（他ユーザー）に遷移
  
| QRコード表示モーダル |              | ユーザー検索（スマホ） | ユーザー検索（Web） |
|----------------------|--------------|------------------------|---------------------|
| <img src="https://github.com/user-attachments/assets/c10b6a6e-1f8a-4ee8-88fc-0790136d4438" width="220"/> |              | <img src="https://github.com/user-attachments/assets/23b403d5-b1f9-49d5-8448-6b16c59a3921" width="220"/> | <img src="https://github.com/user-attachments/assets/1308c50c-0a61-49c5-80f8-d61c631c5027" width="700"/> |

---

### 👤 ユーザーページ（他ユーザー）

- アイコン・名前・自己紹介など表示  
- フレンド申請、削除、報告ボタンを設置  
- メッセージボタン（フレンド成立時のみ）あり  

<div align="center">

<table>
  <tr>
    <th>📱 スマホ画面</th>
    <th>🖥 Web画面</th>
  </tr>
  <tr>
    <td><img src="https://github.com/user-attachments/assets/59ad4d6b-23ab-4058-94ae-168aa2cae8c5" width="400" /></td>
    <td><img src="https://github.com/user-attachments/assets/fdb6a6de-75c9-41d9-b875-79017073a2f0" width="1200" /></td>
  </tr>
</table>

</div>

---


#### フレンド保留中・申請中タブ


- 保留中：自分宛に届いたリクエストを承認 / 拒否  
- 申請中：自分がフレンド申請したユーザーの一覧  

<div align="center">

<table>
  <tr>
    <th>📱 スマホ画面</th>
    <th>🖥 Web画面</th>
  </tr>
  <tr>
    <td><img src="https://github.com/user-attachments/assets/8ef972f1-b1ad-4905-a0a8-2cb1f1521224" width="400" /></td>
    <td><img src="https://github.com/user-attachments/assets/ccfdec93-6f9f-4796-9af1-e2b68dc3a79d" width="1200" /></td>
  </tr>
</table>

</div>

---

### 🏷️ 属性割り当てモーダル

- フレンドに属性を割り当てるモーダル  
- チェックで選択 → 保存で反映  

<div align="center">

<table>
  <tr>
    <th>📱 スマホ画面</th>
    <th>🖥 Web画面</th>
  </tr>
  <tr>
    <td><img src="https://github.com/user-attachments/assets/63a45bb9-6f83-44d6-8e41-335532d1e552" width="400" /></td>
    <td><img src="https://github.com/user-attachments/assets/7add68c1-b71d-4530-b223-eba75109f6ea" width="1200" /></td>
  </tr>
</table>

</div>

---

### 🗂 イベント一覧

- フレンドが投稿したイベントの一覧を確認できる
- イベントを選択するとイベントの詳細ページに遷移

<div align="center">

<table>
  <tr>
    <th>📱 スマホ画面</th>
    <th>🖥 Web画面</th>
  </tr>
  <tr>
    <td><img src="https://github.com/user-attachments/assets/ba6717d0-03b5-4022-8ec5-0fcefe260651" width="400" /></td>
    <td><img src="https://github.com/user-attachments/assets/4347a6d8-e9d4-404a-ba57-aed8910c19e4" width="1200" /></td>
  </tr>
</table>

</div>


---

### 🗂 自分のイベント一覧

- 自分が投稿したイベントの一覧を確認できる  
- 各イベントの詳細表示は可能だが、編集や削除は不可  

<div align="center">

<table>
  <tr>
    <th>📱 スマホ画面</th>
    <th>🖥 Web画面</th>
  </tr>
  <tr>
    <td><img src="https://github.com/user-attachments/assets/f900f66b-ed79-4716-b121-d2b14b18b05c" width="400" /></td>
    <td><img src="https://github.com/user-attachments/assets/88bbeada-73b1-4f8a-b0ea-85dc5b5a59b8" width="1200" /></td>
  </tr>
</table>

</div>

---

### 📩 参加中のイベント一覧

- 参加済みのイベントを一覧表示  
- タップでイベント詳細へ  


<div align="center">

<table>
  <tr>
    <th>📱 スマホ画面</th>
    <th>🖥 Web画面</th>
  </tr>
  <tr>
    <td><img src="https://github.com/user-attachments/assets/4b6a9ecd-8e49-41ae-a6dd-bab3e3ed6bfe" width="400" /></td>
    <td><img src="https://github.com/user-attachments/assets/7502c248-8dcb-4e8b-8531-1c2ef6550fe8" width="1200" /></td>
  </tr>
</table>

</div>

---

### 📝 投稿画面（イベント作成）

- タイトル、日付、募集人数、属性、都道府県、市区町村、開催場所、詳細、集合時間、集合場所、予算、締切日を入力
- 属性を選択して公開範囲を絞れる
- 属性を選択しなかったん場合は全フレンドに表示
- 開催地と集合場所が違う場合、集合場所の表示切り替えボタンで集合場所の入力欄を表示させ集合場所を入力する 

<div align="center">

<table>
  <tr>
    <th>📱 スマホ画面</th>
    <th>🖥 Web画面</th>
  </tr>
  <tr>
    <td><img src="https://github.com/user-attachments/assets/8deece68-f566-46eb-ad4c-6f50ce750c16" width="400" /></td>
    <td><img src="https://github.com/user-attachments/assets/a6427c58-9ea2-4644-8959-73c93aae5e0b" width="1200" /></td>
  </tr>
</table>

</div>


---

### 📄 イベント詳細画面

- イベントの詳細を確認  
- 「参加」ボタンで参加状態になり、グループチャットへ自動参加  
- 投稿者に通知が届く  

- 集合場所のリンクをタップすると、**Google Map が開かれます**  
- その下に、**地図のプレビュー**が表示されます

#### 📱 スマホ版

- OpenStreetMap を利用

#### 🖥 Web版

- Google Map を埋め込み表示

🔸 ただし、以下のような場合はマップやピンが正しく表示されないことや意図した地点と異なる場所が表示される可能性があります
- **「俺の家」や「いつものところ」などの曖昧な表現や、実在しない架空の店名**の場合

> ⚠️ 実際のマップに正確な場所を表示したい場合は、**実在の店舗名＋店舗名の支店名まで含めた入力**を推奨します。**著作権や商標の観点から README や公開画面上では企業名の使用を避けています**。


<div align="center">

<table>
  <tr>
    <th>📱 スマホ画面</th>
    <th>🖥 Web画面</th>
  </tr>
  <tr>
    <td><img src="https://github.com/user-attachments/assets/33cc720f-d43b-4246-a1ed-498ba18b1d27" width="400" /></td>
    <td><img src="https://github.com/user-attachments/assets/46f2da65-f2b9-47bf-9fcb-eda5ed6dd0f2" width="1200" /></td>
  </tr>
</table>

</div>


---

### 💬 チャット一覧

- グループチャットと個人チャットをタブで切り替え  
- イベント参加でグループ、自動で個人チャット生成される  
  
<div align="center">

<table>
  <tr>
    <th>📱 グループチャット（スマホ）</th>
    <th>🖥 グループチャット（Web）</th>
  </tr>
  <tr>
    <td><img src="https://github.com/user-attachments/assets/6c5390d2-aa55-4c62-8887-59caad68ffd6" width="400" /></td>
    <td><img src="https://github.com/user-attachments/assets/4db39d9c-123b-4d56-bbbd-3deba16d5db9" width="1200" /></td>
  </tr>
    </table>
<br /><br />
    <table>
  <tr>
    <th>📱 個人チャット（スマホ）</th>
    <th>🖥 個人チャット（Web）</th>
  </tr>
  <tr>
    <td><img src="https://github.com/user-attachments/assets/0582648a-0ae7-42c5-81ce-026282e0a744" width="400" /></td>
    <td><img src="https://github.com/user-attachments/assets/ea9a7b32-b646-4ed9-a547-223e7561cc22" width="1200" /></td>
  </tr>
</table>

</div>

---

### 🗨️ チャットルーム

- リアルタイムでのメッセージ送受信が可能
- 各メッセージに既読機能を搭載
- チャット一覧画面では、未読バッジによって新着メッセージが一目でわかる
  
<div align="center">

<table>
  <tr>
    <th>📱 スマホ画面</th>
    <th>🖥 Web画面</th>
  </tr>
  <tr>
    <td><img src="https://github.com/user-attachments/assets/c7a14e6b-87a3-444e-8362-2db8772d6bce" width="400" /></td>
    <td><img src="https://github.com/user-attachments/assets/75e256e4-e013-426f-a7a9-64e1f3103beb" width="1200" /></td>
  </tr>
</table>

</div>

---

### 👤 ユーザーページ（自分）

- プロフィール表示・編集  
- 空いている日付・時間の登録  
- やりたいことリスト（未実装）  

<div align="center">

<table>
  <tr>
    <th>📱 スマホ画面</th>
    <th>🖥 Web画面</th>
  </tr>
  <tr>
    <td><img src="https://github.com/user-attachments/assets/b3e15c30-6237-417f-808d-f89af6649455" width="400" /></td>
    <td><img src="https://github.com/user-attachments/assets/52883602-18a4-4cd5-b1fd-269964c13ee6" width="1200" /></td>
  </tr>
</table>

</div>

---

### ✏️ プロフィール編集画面

- アイコン・ユーザー名・自己紹介の編集  
- 「保存」で反映。
- 保存ボタンの下にある「ログアウト」で初期画面へ  

<div align="center">

<table>
  <tr>
    <th>📱 スマホ画面</th>
    <th>🖥 Web画面</th>
  </tr>
  <tr>
    <td><img src="https://github.com/user-attachments/assets/e06f4837-f920-4a2f-bb1d-2bd518b3a731" width="400" /></td>
    <td><img src="https://github.com/user-attachments/assets/bf55e4fd-0134-4ecd-adb9-e105144a7d96" width="1200" /></td>
  </tr>
</table>

</div>

---

## 🚀 今後の展望

- **「暇な日カレンダー」入力の継続を促す通知機能の実装**  
　ユーザーが継続的にスケジュールを入力できるように、1週間ごとにリマインド通知を送信する仕組みを追加予定。

- **やりたいことリストの不具合修正と本実装**  
　現在一部機能に不具合がある「やりたいことリスト」については、修正後に正式な機能として実装を行う予定。

- **疎遠防止アラートの実装**  
　特定のフレンドとのやり取りや接触が一定期間ない場合に、ユーザーへ通知を送る「疎遠防止アラート」機能を実装し、つながりを保つサポートを行なっていく予定。
