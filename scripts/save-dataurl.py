import sys, base64, json, re
raw = open(sys.argv[1]).read()
m = re.search(r'data:image/png;base64,([A-Za-z0-9+/=]+)', raw)
open(sys.argv[2], 'wb').write(base64.b64decode(m.group(1)))
