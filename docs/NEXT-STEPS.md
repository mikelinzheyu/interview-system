# 馃殌 涓嬩竴姝ユ搷浣滄寚鍗?

## 馃搵 褰撳墠鐘舵€?

鉁?**宸插畬鎴愮殑鍑嗗宸ヤ綔**:
- P0-P1-P2 鎵€鏈変唬鐮佷慨澶嶅拰瀹炵幇
- Redis 瀹㈡埛绔拰浼氳瘽瀛樺偍 API
- Docker Compose 閰嶇疆
- Redis 閰嶇疆鏂囦欢
- 瀹屾暣鐨勬祴璇曡剼鏈?
- 璇︾粏鐨勯儴缃叉枃妗?

鈿狅笍 **褰撳墠鐘舵€?*:
- Docker Desktop 鏈繍琛?
- 鍚庣鏈嶅姟杩愯涓紙浣跨敤鍐呭瓨瀛樺偍妯″紡锛?
- 鍓嶇鏈嶅姟杩愯涓?

---

## 馃幆 涓嬩竴姝ユ搷浣滐紙鎸夐『搴忔墽琛岋級

### 姝ラ 1: 鍚姩 Docker Desktop 猸?蹇呴』

#### 鏂规硶 1: 閫氳繃寮€濮嬭彍鍗?

1. 鎸?`Win` 閿?
2. 杈撳叆 "Docker Desktop"
3. 鐐瑰嚮鎵撳紑
4. 绛夊緟 30-60 绉掞紝鐩村埌鍙充笅瑙掔殑 Docker 鍥炬爣鏄剧ず缁胯壊锛堣繍琛屼腑锛?

#### 鏂规硶 2: 鐩存帴杩愯

鍙屽嚮鎵撳紑锛歚C:\Program Files\Docker\Docker\Docker Desktop.exe`

#### 楠岃瘉 Docker 宸插惎鍔?

鎵撳紑鍛戒护鎻愮ず绗︽垨 PowerShell锛岃繍琛岋細

```bash
docker info
```

**鎴愬姛鏍囧織**: 鏄剧ず Docker 鐗堟湰淇℃伅锛屾棤閿欒

**濡傛灉澶辫触**: 绛夊緟 Docker Desktop 瀹屽叏鍚姩锛岀劧鍚庨噸璇?

---

### 姝ラ 2: 鍚姩 Redis 鏈嶅姟

#### 鏂规硶 A: 浣跨敤鍚姩鑴氭湰锛堟帹鑽愶紝鏈€绠€鍗曪級

```
鍙屽嚮杩愯: D:\code7\interview-system\production\start-redis.bat
```

鑴氭湰浼氳嚜鍔細
1. 妫€鏌?Docker 鏄惁杩愯
2. 鍚姩 Redis 鏈嶅姟
3. 楠岃瘉 Redis 灏辩华

#### 鏂规硶 B: 浣跨敤鍛戒护琛?

鎵撳紑鍛戒护鎻愮ず绗︼紝杩愯锛?

```bash
cd D:\code7\interview-system\production
docker-compose up -d redis
```

**棰勬湡杈撳嚭**:
```
Creating network "production_interview-network" done
Creating volume "production_redis_data" done
Pulling redis (redis:7-alpine)...
...
Creating interview-redis ... done
```

---

### 姝ラ 3: 楠岃瘉 Redis 杩愯

#### 妫€鏌ユ湇鍔＄姸鎬?

```bash
cd D:\code7\interview-system\production
docker-compose ps
```

**棰勬湡杈撳嚭**:
```
Name                   Command               State    Ports
----------------------------------------------------------------
interview-redis     docker-entrypoint.sh ...   Up     0.0.0.0:6379->6379/tcp
```

#### 娴嬭瘯 Redis 杩炴帴

```bash
docker-compose exec redis redis-cli ping
```

**棰勬湡杈撳嚭**: `PONG`

---

### 姝ラ 4: 杩愯 Redis 杩炴帴娴嬭瘯

```bash
cd D:\code7\interview-system
"C:\Program Files\nodejs\node.exe" test-redis-connection.js
```

**棰勬湡杈撳嚭**:
```
馃И Redis 杩炴帴娴嬭瘯
============================================================
鉁?Redis 杩炴帴鎴愬姛!

馃摑 娴嬭瘯 1: PING 鍛戒护
   鍝嶅簲: PONG
   鉁?PING 娴嬭瘯閫氳繃

馃摑 娴嬭瘯 2: 鍐欏叆鏁版嵁
   鉁?鍐欏叆娴嬭瘯鏁版嵁鎴愬姛

馃摑 娴嬭瘯 3: 璇诲彇鏁版嵁
   鉁?璇诲彇娴嬭瘯鏁版嵁鎴愬姛锛屾暟鎹竴鑷?

馃摑 娴嬭瘯 4: 璁剧疆 TTL
   鉁?TTL 璁剧疆鎴愬姛

馃摑 娴嬭瘯 5: 鍒犻櫎鏁版嵁
   鉁?娓呯悊娴嬭瘯鏁版嵁瀹屾垚

馃摑 娴嬭瘯 6: 鏌ョ湅鐜版湁浼氳瘽
   浼氳瘽鏁伴噺: 0
   褰撳墠娌℃湁浼氳瘽鏁版嵁
   鉁?鏌ヨ鎴愬姛

馃摑 娴嬭瘯 7: Redis 鏈嶅姟鍣ㄤ俊鎭?
   redis_version:7.x.x
   redis_mode:standalone
   鉁?淇℃伅鑾峰彇鎴愬姛

馃帀 鎵€鏈夋祴璇曢€氳繃! Redis 鏈嶅姟鍣ㄥ伐浣滄甯?
```

---

### 姝ラ 5: 閲嶅惎鍚庣鏈嶅姟浠ヨ繛鎺?Redis

#### 5.1 鍋滄褰撳墠鍚庣

鎵惧埌杩愯鍚庣鐨勭粓绔獥鍙ｏ紝鎸?`Ctrl+C` 鍋滄锛屾垨鑰咃細

```bash
# 鎵惧埌鍚庣杩涚▼骞跺仠姝?
tasklist | findstr "node.exe"
taskkill /PID <杩涚▼ID> /F
```

#### 5.2 鏇存柊鍚庣鐜鍙橀噺

鐢变簬鍚庣鍦ㄦ湰鍦拌繍琛岋紙涓嶅湪 Docker 涓級锛岄渶瑕佷娇鐢?`localhost` 杩炴帴 Redis銆?

缂栬緫 `D:\code7\interview-system\backend\.env`锛堝鏋滄病鏈夊垯鍒涘缓锛?

```env
# Redis 閰嶇疆锛堟湰鍦拌繛鎺?Docker 涓殑 Redis锛?
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_SESSION_TTL=604800

# Dify 閰嶇疆
DIFY_API_KEY=app-aROZ5FjseJWUtmRzzjlb6b5E
DIFY_API_BASE_URL=https://api.dify.ai/v1
```

#### 5.3 閲嶆柊鍚姩鍚庣

```bash
cd D:\code7\interview-system
"C:\Program Files\nodejs\node.exe" backend\mock-server.js
```

#### 5.4 楠岃瘉鍚庣杩炴帴 Redis

鏌ョ湅鍚庣鍚姩鏃ュ織锛屽簲璇ョ湅鍒帮細

```
馃攧 姝ｅ湪鍒濆鍖?Redis 瀹㈡埛绔?..
鉁?Redis 杩炴帴鎴愬姛
馃煝 Redis 瀹㈡埛绔氨缁?
馃敡 Redis 閰嶇疆: {
  host: 'localhost',
  port: 6379,
  db: 0,
  sessionTTL: '604800绉?(7澶?'
}

馃摑 鍙敤鎺ュ彛:
   ...
   POST /api/interview/sessions - 淇濆瓨浼氳瘽鏁版嵁 馃啎
   GET  /api/interview/sessions - 鑾峰彇鎵€鏈変細璇滻D 馃啎
   GET  /api/interview/sessions/:id - 鍔犺浇浼氳瘽鏁版嵁 馃啎
   DELETE /api/interview/sessions/:id - 鍒犻櫎浼氳瘽鏁版嵁 馃啎
   PUT  /api/interview/sessions/:id/touch - 鏇存柊浼氳瘽TTL 馃啎
```

**濡傛灉鐪嬪埌**:
```
鉂?Redis 鍒濆鍖栧け璐?
鈿狅笍  灏嗕娇鐢ㄥ唴瀛樺瓨鍌ㄤ綔涓洪檷绾ф柟妗?
```

**璇存槑**: Redis 杩炴帴澶辫触锛岃妫€鏌ワ細
1. Redis 鏄惁杩愯锛歚docker-compose ps redis`
2. 绔彛鏄惁姝ｇ‘锛歚REDIS_PORT=6379`
3. 涓绘満鍚嶆槸鍚︽纭細`REDIS_HOST=localhost`

---

### 姝ラ 6: 娴嬭瘯浼氳瘽瀛樺偍鍔熻兘

```bash
cd D:\code7\interview-system
"C:\Program Files\nodejs\node.exe" test-redis-session.js
```

**棰勬湡杈撳嚭鍙樺寲**:

**涔嬪墠锛堝唴瀛樻ā寮忥級**:
```
馃捑 浼氳瘽宸蹭繚瀛樺埌鍐呭瓨: session-xxx (Redis涓嶅彲鐢?
馃搨 浠庡唴瀛樺姞杞戒細璇? session-xxx (Redis涓嶅彲鐢?
```

**鐜板湪锛圧edis 妯″紡锛?*:
```
馃捑 浼氳瘽宸蹭繚瀛樺埌 Redis: session-xxx
馃搨 浠?Redis 鍔犺浇浼氳瘽: session-xxx
```

**瀹屾暣娴嬭瘯缁撴灉**:
```
馃И Redis 浼氳瘽瀛樺偍闆嗘垚娴嬭瘯
============================================================

馃摑 娴嬭瘯 1: 淇濆瓨浼氳瘽鏁版嵁
鉁?淇濆瓨浼氳瘽鎴愬姛

馃搨 娴嬭瘯 2: 鍔犺浇浼氳瘽鏁版嵁
  鑱屼綅: Python鍚庣寮€鍙戝伐绋嬪笀
  闂: 璇蜂粙缁嶄竴涓嬩綘瀵筆ython瑁呴グ鍣ㄧ殑鐞嗚В
  鍒涘缓鏃堕棿: 2025-10-10T...
鉁?鍔犺浇浼氳瘽鎴愬姛锛屾暟鎹竴鑷?

馃搵 娴嬭瘯 4: 鑾峰彇鎵€鏈変細璇滻D
  浼氳瘽鎬绘暟: 1
  浼氳瘽ID鍒楄〃: [ 'test-session-...' ]
鉁?鑾峰彇浼氳瘽鍒楄〃鎴愬姛锛屽寘鍚祴璇曚細璇?

馃攧 娴嬭瘯 5: 鏇存柊浼氳瘽鏁版嵁
鉁?鏇存柊浼氳瘽鎴愬姛锛屽垎鏁板凡淇濆瓨: 85

馃棏锔? 娴嬭瘯 6: 鍒犻櫎浼氳瘽鏁版嵁
鉁?鍒犻櫎浼氳瘽鎴愬姛
鉁?楠岃瘉鍒犻櫎鎴愬姛锛屼細璇濆凡涓嶅瓨鍦?

馃帀 鎵€鏈夋祴璇曞畬鎴?
```

---

### 姝ラ 7: 娴嬭瘯 Dify 宸ヤ綔娴侀泦鎴愶紙鍙€夛級

璁块棶鍓嶇椤甸潰娴嬭瘯瀹為檯鍔熻兘锛?

1. 鎵撳紑娴忚鍣ㄨ闂? `http://localhost:5174/interview/ai`

2. 鍦?鏅鸿兘涓撲笟棰樼洰鐢熸垚"涓緭鍏ワ細
   - 涓撲笟鍚嶇О: `Python鍚庣寮€鍙戝伐绋嬪笀`
   - 闅惧害: `涓骇`

3. 鐐瑰嚮"鏅鸿兘鐢熸垚棰樼洰"

4. 绛夊緟 30-90 绉掞紙涓嶅啀瓒呮椂锛?

5. 鏌ョ湅缁撴灉锛?
   - 鉁?鎴愬姛鐢熸垚闈㈣瘯闂
   - 鉁?浼氳瘽鏁版嵁淇濆瓨鍒?Redis
   - 鉁?鍙互杩涜鍚庣画璇勫垎

---

## 馃搳 楠岃瘉娓呭崟

瀹屾垚涓婅堪姝ラ鍚庯紝妫€鏌ヤ互涓嬮」鐩細

### Docker 鐜
- [ ] Docker Desktop 宸插惎鍔ㄥ苟杩愯
- [ ] Redis 瀹瑰櫒鐘舵€佷负 "Up"
- [ ] Redis 鍋ュ悍妫€鏌ラ€氳繃锛坄docker inspect interview-redis`锛?

### 杩炴帴娴嬭瘯
- [ ] `test-redis-connection.js` 鍏ㄩ儴閫氳繃
- [ ] 鍚庣鏃ュ織鏄剧ず "Redis 杩炴帴鎴愬姛"
- [ ] `test-redis-session.js` 鏄剧ず "淇濆瓨鍒?Redis"

### 鍔熻兘娴嬭瘯
- [ ] Dify 宸ヤ綔娴佽皟鐢ㄦ垚鍔燂紙涓嶈秴鏃讹級
- [ ] 浼氳瘽鏁版嵁鎸佷箙鍖栧埌 Redis
- [ ] 閲嶅惎鍚庣鍚庝細璇濇暟鎹粛鐒跺瓨鍦?

---

## 馃洜锔?甯哥敤绠＄悊鍛戒护

### Docker 绠＄悊

```bash
# 杩涘叆 production 鐩綍
cd D:\code7\interview-system\production

# 鏌ョ湅鎵€鏈夋湇鍔＄姸鎬?
docker-compose ps

# 鏌ョ湅 Redis 鏃ュ織
docker-compose logs -f redis

# 閲嶅惎 Redis
docker-compose restart redis

# 鍋滄 Redis
docker-compose stop redis

# 鍚姩 Redis
docker-compose start redis
```

### Redis 绠＄悊

```bash
# 杩涘叆 Redis CLI
docker-compose exec redis redis-cli

# 鏌ョ湅鎵€鏈変細璇?
docker-compose exec redis redis-cli keys "interview:session:*"

# 鏌ョ湅鐗瑰畾浼氳瘽
docker-compose exec redis redis-cli get "interview:session:xxx"

# 鏌ョ湅 Redis 淇℃伅
docker-compose exec redis redis-cli info

# 鏌ョ湅鍐呭瓨浣跨敤
docker-compose exec redis redis-cli info memory
```

### 鍚庣绠＄悊

```bash
# 鍋滄鍚庣锛堝湪杩愯鍚庣鐨勭粓绔寜 Ctrl+C锛?

# 鍚姩鍚庣
cd D:\code7\interview-system
"C:\Program Files\nodejs\node.exe" backend\mock-server.js

# 鎴栬€呬娇鐢ㄥ悗鍙拌繍琛岋紙Windows PowerShell锛?
Start-Process node -ArgumentList "backend\mock-server.js" -NoNewWindow
```

---

## 馃摎 鏂囨。绱㈠紩

濡傛灉閬囧埌闂锛岃鏌ョ湅锛?

| 鏂囨。 | 鐢ㄩ€?|
|------|------|
| `DOCKER-REDIS-DEPLOYMENT.md` | 瀹屾暣鐨?Docker Redis 閮ㄧ讲鎸囧崡 |
| `REDIS-INSTALLATION-GUIDE.md` | Redis 澶氱瀹夎鏂瑰紡 |
| `P2-REDIS-IMPLEMENTATION-COMPLETE.md` | P2 Redis 瀹炴柦璇︾粏鎶ュ憡 |
| `P0-P1-P2-COMPLETE-SUMMARY.md` | 瀹屾暣鐨勯」鐩€荤粨 |
| `DIFY-PYTHON-CODE-FOR-REDIS.md` | Dify Python 浠ｇ爜绀轰緥 |

---

## 馃悰 蹇€熸晠闅滄帓闄?

### 闂 1: Docker Desktop 鍚姩澶辫触

**鐥囩姸**: Docker Desktop 鏃犳硶鍚姩鎴栦竴鐩存樉绀?"Starting"

**瑙ｅ喅鏂规**:
1. 閲嶅惎璁＄畻鏈?
2. 浠ョ鐞嗗憳韬唤杩愯 Docker Desktop
3. 妫€鏌?Hyper-V 鏄惁鍚敤锛圵indows 鍔熻兘锛?
4. 妫€鏌?WSL2 鏄惁瀹夎

### 闂 2: Redis 瀹瑰櫒鏃犳硶鍚姩

**鐥囩姸**: `docker-compose up -d redis` 澶辫触

**瑙ｅ喅鏂规**:
```bash
# 鏌ョ湅璇︾粏閿欒
docker-compose logs redis

# 鍒犻櫎骞堕噸鏂板垱寤?
docker-compose rm -f redis
docker-compose up -d redis
```

### 闂 3: 鍚庣鏃犳硶杩炴帴 Redis

**鐥囩姸**: 鍚庣鏃ュ織鏄剧ず "Redis 鍒濆鍖栧け璐?

**妫€鏌ユ竻鍗?*:
1. Redis 鏄惁杩愯锛歚docker-compose ps redis`
2. 绔彛鏄惁姝ｇ‘锛氬簲璇ユ槸 `6379`
3. 涓绘満鍚嶏細鏈湴杩愯鐢?`localhost`锛孌ocker 涓敤 `redis`
4. 闃茬伀澧欐槸鍚﹂樆姝?

**瑙ｅ喅鏂规**:
```bash
# 娴嬭瘯绔彛杩為€氭€?
telnet localhost 6379

# 鎴栦娇鐢?PowerShell
Test-NetConnection -ComputerName localhost -Port 6379
```

### 闂 4: 浼氳瘽鏁版嵁涓㈠け

**鐥囩姸**: 閲嶅惎 Redis 鍚庝細璇濇暟鎹秷澶?

**鍘熷洜**: 鎸佷箙鍖栨湭鐢熸晥

**妫€鏌?*:
```bash
# 妫€鏌?AOF 鏂囦欢
docker-compose exec redis ls -lh /data/appendonly.aof

# 妫€鏌?RDB 鏂囦欢
docker-compose exec redis ls -lh /data/dump.rdb
```

**瑙ｅ喅鏂规**: 宸插湪閰嶇疆涓惎鐢紝鏃犻渶棰濆鎿嶄綔

---

## 馃幆 鎴愬姛鏍囧噯

褰撴偍鐪嬪埌浠ヤ笅鎵€鏈夎緭鍑烘椂锛岃鏄庨儴缃叉垚鍔燂細

鉁?Docker Desktop 杩愯涓?
鉁?`docker-compose ps` 鏄剧ず Redis 涓?"Up"
鉁?`docker-compose exec redis redis-cli ping` 杩斿洖 "PONG"
鉁?`test-redis-connection.js` 鍏ㄩ儴閫氳繃
鉁?鍚庣鏃ュ織: "Redis 杩炴帴鎴愬姛"
鉁?`test-redis-session.js` 鏄剧ず "淇濆瓨鍒?Redis"
鉁?Dify 宸ヤ綔娴佽皟鐢ㄦ垚鍔燂紝涓嶈秴鏃?

---

## 馃摓 涓嬩竴姝ユ敮鎸?

瀹屾垚涓婅堪姝ラ鍚庯細

1. 鉁?**濡傛灉涓€鍒囨甯?*:
   - Redis 鎸佷箙鍖栦細璇濆瓨鍌ㄥ凡鍚敤
   - 鍙互寮€濮嬫甯镐娇鐢ㄧ郴缁?
   - 浼氳瘽鏁版嵁灏嗘寔涔呬繚瀛?7 澶?

2. 鈿狅笍 **濡傛灉閬囧埌闂**:
   - 鏌ョ湅瀵瑰簲鐨勬晠闅滄帓闄ら儴鍒?
   - 杩愯娴嬭瘯鑴氭湰瀹氫綅闂
   - 鏌ョ湅 Docker 鍜?Redis 鏃ュ織

3. 馃殌 **鍚庣画浼樺寲**锛堝彲閫夛級:
   - 璁剧疆 Redis 瀵嗙爜
   - 閰嶇疆鑷姩澶囦唤
   - 璁剧疆鐩戞帶鍛婅
   - 璋冩暣 Dify 宸ヤ綔娴佹俯搴﹀弬鏁?

---

**褰撳墠鏃堕棿**: 2025-10-10
**鐘舵€?*: 鈴革笍 绛夊緟鍚姩 Docker Desktop
**涓嬩竴涓搷浣?*: 鍚姩 Docker Desktop 鈫?杩愯 `start-redis.bat`

绁濇偍閮ㄧ讲椤哄埄锛侌煄?

