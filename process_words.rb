require "json"

def weight(freq,rank,len)
	w = Math.log2(freq) * 100_000
	w *= 0.5 if len > 7
	w *= 0.25 if rank > 30_000
	w.round
end

file = IO.read("wordlist-unprocessed.txt")
lines = file.lines.select {|l| l =~ /^\d+\s+\w+\s+\w+\s+\d+\s+[\.\d]+/}.map(&:split).map { |e| [e[1],weight(e[3].to_i,e[0].to_i,e[1].length)] }
File.open("wordlist.json","w") do |f|
	f.puts JSON.pretty_generate(lines)
end