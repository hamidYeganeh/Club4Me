export const ROTATE_REFRESH_LUA = `
local stored = redis.call('GET', KEYS[1])
if stored ~= ARGV[1] then
  return 0
end
redis.call('DEL', KEYS[1])
redis.call('SREM', KEYS[2], ARGV[2])
redis.call('SET', KEYS[3], ARGV[1], 'EX', tonumber(ARGV[4]))
redis.call('SADD', KEYS[2], ARGV[3])
redis.call('EXPIRE', KEYS[2], tonumber(ARGV[4]))
return 1
`.trim();
