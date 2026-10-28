#!/usr/bin/env bash
# Claude Code status line modeled on pi's footer: the session's token totals, cache hit rate and
# context usage, with the model, effort level and 5-hour limit aligned right.

# The interface adds its own spacing around the status line, so a line as wide as `COLUMNS`
# would wrap.
margin=4

input=$(cat)
transcript=$(jq -r '.transcript_path // empty' <<<"$input")

# Token totals of the main conversation. The transcript repeats an assistant message once per
# content block with the same usage, so each message counts once, by its id. Lines that do not
# parse, such as one still being written, are skipped.
totals='{}'
if [[ -r $transcript ]]; then
  totals=$(jq -nRc '
    reduce (inputs | fromjson? | select(.type == "assistant" and (.isSidechain | not) and .message.usage != null))
      as $entry ({}; .[$entry.message.id // $entry.uuid] = $entry.message.usage)
    | [.[]]
    | {input: (map(.input_tokens // 0) | add // 0),
       output: (map(.output_tokens // 0) | add // 0),
       cache_read: (map(.cache_read_input_tokens // 0) | add // 0),
       cache_write: (map(.cache_creation_input_tokens // 0) | add // 0)}
  ' "$transcript") || totals='{}'
fi

jq -r --argjson totals "$totals" --argjson width $((${COLUMNS:-80} - margin)) '
# Format a non-negative number with a fixed number of decimals, as toFixed does in JavaScript.
def fixed($digits):
  pow(10; $digits) as $scale
  | (. * $scale | round) as $scaled
  | ($scaled % $scale | tostring) as $fraction
  | "\(($scaled - ($scaled % $scale)) / $scale).\(("0" * ($digits - ($fraction | length))) // "")\($fraction)";

# The token format of pi: 999, 1.5k, 42k, 1.5M, 42M.
def tokens:
  if . < 1000 then tostring
  elif . < 10000 then "\(. / 1000 | fixed(1))k"
  elif . < 1000000 then "\(. / 1000 | round)k"
  elif . < 10000000 then "\(. / 1000000 | fixed(1))M"
  else "\(. / 1000000 | round)M"
  end;

def truncate($width; $ellipsis):
  if length <= $width then . else .[:([$width - ($ellipsis | length), 0] | max)] + $ellipsis end;

"\u001b[2m" as $dim
| "\u001b[0m" as $reset
| .context_window.current_usage as $usage
| (if $usage == null then null
   else ($usage.input_tokens // 0) + ($usage.cache_read_input_tokens // 0) + ($usage.cache_creation_input_tokens // 0)
   end) as $prompt
| [
    (if $totals.input > 0 then "↑\($totals.input | tokens)" else empty end),
    (if $totals.output > 0 then "↓\($totals.output | tokens)" else empty end)
  ] as $io_stats
| [
    (if $totals.cache_read > 0 then "R\($totals.cache_read | tokens)" else empty end),
    (if $totals.cache_write > 0 then "W\($totals.cache_write | tokens)" else empty end),
    (if ($totals.cache_read > 0 or $totals.cache_write > 0) and $prompt != null and $prompt > 0
     then "CH\(($usage.cache_read_input_tokens // 0) / $prompt * 100 | fixed(1))%"
     else empty end)
  ] as $cache_stats
| (.context_window.context_window_size // 0) as $window
| (if $prompt == null or $window == 0 then null else $prompt / $window * 100 end) as $percent
| ((if $percent == null then "?" else "\($percent | fixed(1))%" end) + "/\($window | tokens)") as $context
| (if $percent == null then $dim
   elif $percent > 90 then "\u001b[31m"
   elif $percent > 70 then "\u001b[33m"
   else $dim end) as $context_color
# The model id without the `claude-` prefix and with its version dotted: opus-5.5.
| (.model.id // "no-model"
   | sub("^claude-"; "")
   | sub("-(?<major>[0-9])-(?<minor>[0-9])(?<date>(-[0-9]{8})?)$"; "-\(.major).\(.minor)\(.date)")) as $model
| (.rate_limits.five_hour as $limit
   | if $limit.used_percentage == null then ""
     else ([($limit.resets_at // now) - now, 0] | max | . / 60 | floor) as $minutes
       | " \($limit.used_percentage | round)% ↻"
         + (if $minutes >= 60 then "\($minutes / 60 | floor)h\($minutes % 60)m" else "\($minutes)m" end)
     end) as $limit
| (if .thinking.enabled == false then "\($model) thinking off"
   elif .effort.level then "\($model) \(.effort.level)"
   else $model end
   + $limit) as $right
# The cache statistics are left out when the full line does not fit, as in a narrow sidebar.
| ($io_stats + $cache_stats | join(" ")) as $full_stats
| (if ($full_stats | length) + ($context | length) + ($right | length) + 3 <= $width
   then $full_stats
   else $io_stats | join(" ") end) as $stats
| (if $stats == "" then "" else $stats + " " end) as $prefix
| ($prefix + $context) as $left
| ($width - ($left | length) - 2) as $room
| (if $room <= 0 then "" else $right | truncate($room; "") end) as $shown_right
| if ($left | length) > $width
  then $dim + ($left | truncate($width; "...")) + $reset
  else $dim + $prefix + $reset + $context_color + $context + $reset
    + (if $shown_right == ""
       then ""
       else $dim + " " * ($width - ($left | length) - ($shown_right | length)) + $shown_right + $reset
       end)
  end
' <<<"$input"
