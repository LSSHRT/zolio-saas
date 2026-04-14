import re

def check_tags(filename):
    with open(filename, 'r') as f:
        content = f.read()
    
    # Simple regex for tags, ignoring self-closing tags and some common issues
    # This is NOT a full JSX parser, but can help find obvious mismatches
    tags = re.findall(r'<(/?[a-zA-Z0-9\.]+)(?:\s+[^>]*?)?>', content)
    
    stack = []
    for tag in tags:
        if tag.startswith('/'):
            if not stack:
                print(f"Extra closing tag: {tag}")
                continue
            last = stack.pop()
            if last != tag[1:]:
                print(f"Mismatched tag: opened {last}, closed {tag}")
        else:
            # Ignore self-closing tags (though regex above tries to exclude them, 
            # it's hard with just regex if they don't have / at the end)
            # Actually the regex above doesn't handle <div /> well if we don't check for />
            pass

    # Better approach: find all <tag and all </tag>
    # And handle self-closing tags
    
    content = re.sub(r'<[a-zA-Z0-9\.]+\s+[^>]*?/>', '', content) # remove self-closing
    content = re.sub(r'<[a-zA-Z0-9\.]+/>', '', content) # remove self-closing without space
    
    opens = re.findall(r'<([a-zA-Z0-9\.]+)(?:\s+[^>]*?)?>', content)
    closes = re.findall(r'</([a-zA-Z0-9\.]+)>', content)
    
    print(f"Total opens: {len(opens)}")
    print(f"Total closes: {len(closes)}")
    
    stack = []
    for match in re.finditer(r'<(/?)([a-zA-Z0-9\.]+)(?:\s+[^>]*?)?>', content):
        is_close = match.group(1) == '/'
        tag_name = match.group(2)
        
        if is_close:
            if not stack:
                print(f"Unexpected close tag </{tag_name}> at position {match.start()}")
            else:
                last_tag, last_pos = stack.pop()
                if last_tag != tag_name:
                    print(f"Mismatched tag </{tag_name}> at {match.start()} (expected </{last_tag}> from {last_pos})")
        else:
            stack.append((tag_name, match.start()))
            
    if stack:
        print("Unclosed tags:")
        for tag, pos in stack:
            line_num = content.count('\n', 0, pos) + 1
            print(f"  <{tag}> at line {line_num}")

check_tags('src/app/dashboard/dashboard-content.tsx')
