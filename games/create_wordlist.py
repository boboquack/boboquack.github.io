l=[[] for i in range(9)]
s=set()
with open('5d+2a.txt','r') as fin:
    for word in fin.readlines():
        word=word.strip()
        if word.isascii() and word.isalpha() and word.islower() and 4<=len(word)<=12:
            l[len(word)-4].append(word)
            s.add(word)
with open('3of6all.txt','r') as fin:
    for word in fin.readlines():
        word=word.strip()
        if word.isascii() and word.isalpha() and word.islower() and 4<=len(word)<=12:
            s.add(word)
with open('words.js','w') as fout:
    fout.write(f'''
window.words={l}
window.all_words={list(s)}
'''.strip().replace("'",'"')+'\n')