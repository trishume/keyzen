require "json"

file = IO.read("wordlist-unprocessed.txt")
lines = file.lines.select {|l| l =~ /^\d+\s+\w+\s+\w+\s+\d+\s+[\.\d]+/}.map(&:split).map { |e| [e[1],e[3].to_i] }
File.open("wordlist.json","w") do |f|
	f.puts JSON.pretty_generate(lines)
end