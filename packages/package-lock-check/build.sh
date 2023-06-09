#!/usr/bin/env bash

! [ -d bin ] && mkdir bin
echo '#!/usr/bin/env node' > bin/index.js
echo '' >> bin/index.js
cat index.js >> bin/index.js
chmod +x bin/index.js

