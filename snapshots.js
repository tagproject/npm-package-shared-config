/* eslint-disable */
/* prettier-ignore */
export default [
  {
    "path": ".github/codeql/codeql-configuration.yml",
    "hash": "b73a6925843a63ac2cc54202ccec74ce7ca7ad44d5313a35162873dbc96e5fa1",
    "merge": false,
    "executable": false,
    "type": "yaml",
    "content": "name : CodeQL Configuration\n\npaths:\n  - './src'\n"
  },
  {
    "path": ".github/workflows/build.yml",
    "hash": "56cdd74dc510299abd949f84054313e381963edd3e16ec6297402e25366e4b8e",
    "merge": false,
    "executable": false,
    "type": "yaml",
    "content": "name: Build\n\non: [push, pull_request]\n\njobs:\n  test:\n    name: Test\n    runs-on: ${{ matrix.os }}\n    strategy:\n      matrix:\n        node-version: [14.x, 15.x]\n        os: [ubuntu-latest]\n    steps:\n    - name: Checkout repository\n      uses: actions/checkout@v2\n\n    - name: Setup Node.js v${{ matrix.node-version }}\n      uses: actions/setup-node@v2\n      with:\n        node-version: ${{ matrix.node-version }}\n\n    - name: Cache node modules\n      id: cache-npm\n      uses: actions/cache@v2\n      with:\n        path: ~/.npm\n        key: npm-${{ runner.os }}-${{ matrix.node-version }}-${{ hashFiles('**/package-lock.json') }}\n\n    - name: Install Dependencies\n      run: npm ci\n      env:\n        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}\n\n    - name: Lint and Test\n      run: |\n        npm run lint\n        npm run test\n\n    - name: Cache coverage\n      if: ${{ success() && matrix.node-version == '15.x' }}\n      uses: actions/cache@v2\n      with:\n        path: coverage\n        key: coverage-${{ runner.os }}-${{ matrix.node-version }}-${{ hashFiles('src/**/*.*', '**/package-lock.json') }}\n\n  build:\n    name: Build\n    needs: [test]\n    runs-on: ubuntu-latest\n    strategy:\n      matrix:\n        node-version: [15.x]\n    steps:\n    - name: Checkout repository\n      uses: actions/checkout@v2\n\n    - name: Use Node.js ${{ matrix.node-version }}\n      uses: actions/setup-node@v2\n      with:\n        node-version: ${{ matrix.node-version }}\n\n    - name: Cache node modules\n      id: cache-npm\n      uses: actions/cache@v2\n      with:\n        path: ~/.npm\n        key: npm-${{ runner.os }}-${{ matrix.node-version }}-${{ hashFiles('**/package-lock.json') }}\n\n    - name: Install Dependencies\n      run: npm ci\n      env:\n        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}\n\n    - name: Build\n      run: npm run build\n\n  coverage:\n    name: Coverage\n    if: ${{ github.event_name == 'push' }}\n    needs: [build]\n    runs-on: ubuntu-latest\n    strategy:\n      matrix:\n        node-version: [15.x]\n    steps:\n    - name: Checkout repository\n      uses: actions/checkout@v2\n\n    - name: Cache coverage\n      id: cache-coverage\n      uses: actions/cache@v2\n      with:\n        path: coverage\n        key: coverage-${{ runner.os }}-${{ matrix.node-version }}-${{ hashFiles('src/**/*.*', '**/package-lock.json') }}\n\n    - name: Setup Node.js v${{ matrix.node-version }}\n      if: steps.cache-coverage.outputs.cache-hit != 'true'\n      uses: actions/setup-node@v2\n      with:\n        node-version: ${{ matrix.node-version }}\n\n    - name: Cache node modules\n      if: steps.cache-coverage.outputs.cache-hit != 'true'\n      id: cache-npm\n      uses: actions/cache@v2\n      with:\n        path: ~/.npm\n        key: npm-${{ runner.os }}-${{ matrix.node-version }}-${{ hashFiles('**/package-lock.json') }}\n\n    - name: Test\n      if: steps.cache-coverage.outputs.cache-hit != 'true'\n      run: |\n        npm ci\n        npm run test\n      env:\n        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}\n\n    - name: Send coverage report\n      uses: codecov/codecov-action@v1\n      with:\n        file: ./coverage/lcov.info\n\n  discord:\n    name: Discord notification\n    needs: [test, build, coverage]\n    if: ${{ always() }}\n    runs-on: ubuntu-latest\n    env:\n      DISCORD_USERNAME: github\n      DISCORD_ERROR_COLOR: 16726645\n      DISCORD_ERROR_AVATAR: https://cdn.jsdelivr.net/gh/tagproject/art/bot/bot-error.png\n      DISCORD_EVENT_COLOR: 53759\n      DISCORD_EVENT_AVATAR: https://cdn.jsdelivr.net/gh/tagproject/art/bot/bot-event.png\n    steps:\n    - name: Send error notification after push commit\n      if: ${{ contains(needs.*.result, 'failure') && github.event_name == 'push' }}\n      uses: sarisia/actions-status-discord@v1\n      with:\n        webhook: ${{ secrets.DISCORD_WEBHOOK }}\n        nodetail: true\n        username: ${{ env.DISCORD_USERNAME }}\n        avatar_url: ${{ env.DISCORD_ERROR_AVATAR }}\n        title: 'Build failed :confused:'\n        color: ${{ env.DISCORD_ERROR_COLOR }}\n        description: |\n          **Repository:** `${{ github.repository }}`\n          **Branch:** `${{ github.event.ref }}`\n          **Author:** [${{ github.event.head_commit.author.username }}](https://github.com/${{ github.event.head_commit.author.username }})\n          **Commit:** [${{ github.event.head_commit.id }}](${{ github.event.head_commit.url }})\n          **Message:**\n          `${{ github.event.head_commit.message }}`\n\n    - name: Send error notification for pull_request\n      if: ${{ contains(needs.*.result, 'failure') && github.event_name == 'pull_request' }}\n      uses: sarisia/actions-status-discord@v1\n      with:\n        webhook: ${{ secrets.DISCORD_WEBHOOK }}\n        nodetail: true\n        username: ${{ env.DISCORD_USERNAME }}\n        avatar_url: ${{ env.DISCORD_ERROR_AVATAR }}\n        title: 'Pull request build failed :confused:'\n        color: ${{ env.DISCORD_ERROR_COLOR }}\n        description: |\n          **Repository:** `${{ github.repository }}`\n          **Merge:** into `${{ github.event.pull_request.base.ref }}` from `${{ github.event.pull_request.head.ref }}`\n          **Title:** ${{ github.event.pull_request.title }} [#${{ github.event.pull_request.number }}](${{github.event.pull_request._links.html.href}})\n          **Assignees:** `${{ join(github.event.pull_request.assignees.*.login, ', ') }}`\n          **Labels:** `${{ join(github.event.pull_request.labels.*.name, ', ') }}`\n\n    - name: Send success notification for pull_request\n      if: ${{ !contains(needs.*.result, 'failure') && github.event_name == 'pull_request' }}\n      uses: sarisia/actions-status-discord@v1\n      with:\n        webhook: ${{ secrets.DISCORD_WEBHOOK }}\n        nodetail: true\n        username: ${{ env.DISCORD_USERNAME }}\n        avatar_url: ${{ env.DISCORD_EVENT_AVATAR }}\n        title: 'Pull request successfully build :face_with_monocle:'\n        color: ${{ env.DISCORD_EVENT_COLOR }}\n        description: |\n          **Repository:** `${{ github.repository }}`\n          **Merge:** into `${{ github.event.pull_request.base.ref }}` from `${{ github.event.pull_request.head.ref }}`\n          **Title:** ${{ github.event.pull_request.title }} [#${{ github.event.pull_request.number }}](${{github.event.pull_request._links.html.href}})\n          **Assignees:** `${{ join(github.event.pull_request.assignees.*.login, ', ') }}`\n          **Labels:** `${{ join(github.event.pull_request.labels.*.name, ', ') }}`\n\n\n\n"
  },
  {
    "path": ".github/workflows/release.yml",
    "hash": "135f113f664311d29456447498377bea1b2228f2a4a918a6fa39e653a7d6aa7b",
    "merge": false,
    "executable": false,
    "type": "yaml",
    "content": "name: Release package\non:\n  push:\n    branches:\n      - main\n\njobs:\n  sync:\n    name: Sync labels\n    runs-on: ubuntu-latest\n    steps:\n    - name: Checkout repository\n      uses: actions/checkout@v2\n\n    - name: Sync project labels\n      uses: micnncim/action-label-syncer@v1\n      env:\n        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}\n\n  publish:\n    name: Publish\n    needs: [sync]\n    runs-on: ubuntu-latest\n    strategy:\n      matrix:\n        node-version: [15.x]\n    steps:\n    - name: Checkout repository\n      uses: actions/checkout@v1\n\n    - name: Setup Node.js v${{ matrix.node-version }}\n      uses: actions/setup-node@v1\n      with:\n        node-version: ${{ matrix.node-version }}\n\n    - name: Install Dependencies\n      run: npm ci\n      env:\n        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}\n\n    - name: Lint and Test\n      run: |\n        npm run lint\n        npm run test\n\n    - name: Build\n      run: npm run build\n\n    - name: Publish package\n      uses: JS-DevTools/npm-publish@v1\n      env:\n        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}\n      with:\n        token: ${{ secrets.NPM_TOKEN }}\n\n  release:\n    name: Create Release\n    needs: [publish]\n    runs-on: ubuntu-latest\n    strategy:\n      matrix:\n        node-version: [15.x]\n    steps:\n    - name: Checkout code\n      uses: actions/checkout@v2\n\n    - name: Use Node.js ${{ matrix.node-version }}\n      uses: actions/setup-node@v2\n      with:\n        node-version: ${{ matrix.node-version }}\n\n    - name: Get package version\n      run: node -p -e '`PACKAGE_VERSION=${require(\"./package.json\").version}`' >> $GITHUB_ENV\n\n    - name: Create Release\n      uses: softprops/action-gh-release@v1\n      env:\n        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}\n      with:\n        tag_name: v${{ env.PACKAGE_VERSION }}\n        body_path: CHANGELOG.md\n        draft: false\n        prerelease: false\n\n  discord:\n    name: Discord notification\n    needs: [publish, release]\n    if: ${{ always() }}\n    runs-on: ubuntu-latest\n    env:\n      DISCORD_USERNAME: github\n      DISCORD_ERROR_COLOR: 16726645\n      DISCORD_ERROR_AVATAR: https://cdn.jsdelivr.net/gh/tagproject/art/bot/bot-error.png\n      DISCORD_SUCCESS_COLOR: 969384\n      DISCORD_SUCCESS_AVATAR: https://cdn.jsdelivr.net/gh/tagproject/art/bot/bot-success.png\n    steps:\n    - name: Checkout code\n      uses: actions/checkout@v2\n\n    - name: Use Node.js ${{ matrix.node-version }}\n      uses: actions/setup-node@v2\n      with:\n        node-version: ${{ matrix.node-version }}\n\n    - name: Get package version\n      run: |\n        node -p -e '`PACKAGE_VERSION=${require(\"./package.json\").version}`' >> $GITHUB_ENV\n        node -p -e '`PACKAGE_NAME=${require(\"./package.json\").name}`' >> $GITHUB_ENV\n\n    - name: Send error notification\n      if: ${{ contains(needs.*.result, 'failure') && github.event_name == 'push' }}\n      uses: sarisia/actions-status-discord@v1\n      with:\n        webhook: ${{ secrets.DISCORD_WEBHOOK }}\n        nodetail: true\n        username: ${{ env.DISCORD_USERNAME }}\n        avatar_url: ${{ env.DISCORD_ERROR_AVATAR }}\n        title: 'Release failed :face_with_symbols_over_mouth:'\n        color: ${{ env.DISCORD_ERROR_COLOR }}\n        description: |\n          **Repository:** [${{ github.repository }}](https://github.com/${{ github.repository }}/releases)\n          **Version:** `v${{ env.PACKAGE_VERSION }}`\n\n    - name: Send success notification\n      if: ${{ !contains(needs.*.result, 'failure') && github.event_name == 'push' }}\n      uses: sarisia/actions-status-discord@v1\n      with:\n        webhook: ${{ secrets.DISCORD_WEBHOOK }}\n        nodetail: true\n        username: ${{ env.DISCORD_USERNAME }}\n        avatar_url: ${{ env.DISCORD_SUCCESS_AVATAR }}\n        title: 'Package successfully released :tada::tada::tada:'\n        color: ${{ env.DISCORD_SUCCESS_COLOR }}\n        description: |\n          **Repository:** [${{ github.repository }}](https://github.com/${{ github.repository }}/releases)\n          **Tag:** [v${{ env.PACKAGE_VERSION }}](https://github.com/${{ github.repository }}/releases/tag/v${{ env.PACKAGE_VERSION }})\n          **NPM:** [${{ env.PACKAGE_NAME }}](https://www.npmjs.com/package/${{ env.PACKAGE_NAME }}/v/${{ env.PACKAGE_VERSION }})\n"
  },
  {
    "path": ".github/workflows/scan.yml",
    "hash": "30169deec26c9758142253eb1f17d8c84aa7f3ac4f7ca23b1e41010140e49b77",
    "merge": false,
    "executable": false,
    "type": "yaml",
    "content": "name: CodeQL scanning\n\non:\n  push:\n    branches: [main]\n  pull_request:\n    branches: [main]\n  schedule:\n    - cron: '0 22 * * 5'\n\njobs:\n  scan:\n    runs-on: ubuntu-latest\n\n    steps:\n    - name: Checkout repository\n      uses: actions/checkout@v2\n      with:\n        fetch-depth: 2\n\n    - name: Initialize CodeQL\n      uses: github/codeql-action/init@v1\n      with:\n        config-file: ./.github/codeql/codeql-configuration.yml\n\n    - name: Autobuild\n      uses: github/codeql-action/autobuild@v1\n\n    - name: Perform CodeQL Analysis\n      uses: github/codeql-action/analyze@v1\n"
  },
  {
    "path": ".github/workflows/sync.yml",
    "hash": "e78d0de85726dd2737e7afc5530eec4d2429c603a11cc2a3a828296a7f48e409",
    "merge": false,
    "executable": false,
    "type": "yaml",
    "content": "name: Synchronize\n\non:\n  pull_request_target:\n    types: [opened, synchronize, reopened, ready_for_review, locked]\n\njobs:\n  labels:\n    name: Pull Request Labeler\n    runs-on: ubuntu-latest\n    steps:\n    - uses: actions/labeler@main\n      with:\n        repo-token: \"${{ secrets.GITHUB_TOKEN }}\"\n        configuration-path: '.github/labeler.yml'\n        sync-labels: true\n"
  },
  {
    "path": ".github/dependabot.yml",
    "hash": "f443dcae1dbc74b55ba07735cec459e1b1be65d8d5badc3b74a98c00911f7dfd",
    "merge": false,
    "executable": false,
    "type": "yaml",
    "content": "version: 2\nupdates:\n- package-ecosystem: npm\n  directory: \"/\"\n  schedule:\n    interval: weekly\n    day: friday\n    time: \"22:00\"\n  open-pull-requests-limit: 10\n  target-branch: dev\n  assignees:\n  - keindev\n  labels:\n  - dependencies\n"
  },
  {
    "path": ".github/labeler.yml",
    "hash": "71b032ffc4344427996011d1d51ca3828261bb5a65ad49d095b592b207e0cb3e",
    "merge": false,
    "executable": false,
    "type": "yaml",
    "content": "test:\n  - src/__mocks__/**/*.test.ts\n  - src/__tests__/**/*.test.ts\n\nworkflow:\n  - .github/**/*\n  - .gitignore\n  - .npmignore\n\nproject:\n  - package-lock.json\n  - package.json\n  - LICENSE\n\nsource:\n  - any: ['src/**/*', '!src/cli/*', '!src/__mocks__/*', '!src/__tests__/*']\n\napi:\n  - bin/**/*\n  - src/cli/**/*\n\ndocs:\n  - any: ['docs/**/*', '*.md', '.ghinfo']\n\nexample:\n  - example/**/*\n\nmedia:\n  - media/**/*\n"
  },
  {
    "path": ".github/labels.yml",
    "hash": "815a73e6a4c3410443f6f560e285faa1e20de000a7b9fca65e90c28eabe99a14",
    "merge": false,
    "executable": false,
    "type": "yaml",
    "content": "# Gray\n- name: docs\n  description: Pull requests that change documentation\n  color: BCBEC0\n- name: media\n  description: Pull requests that change media files\n  color: BCBEC0\n- name: example\n  description: Pull requests that change examples\n  color: BCBEC0\n# Violet\n- name: source\n  description: Pull requests that change sources\n  color: 4400B2\n- name: project\n  description: Pull requests that change main project files\n  color: 4400B2\n# Blue\n- name: release\n  description: Release candidate\n  color: 0260E8\n- name: test\n  description: Pull requests that change tests\n  color: 0260E8\n- name: feature\n  description: Feature request\n  color: E20338\n# Mint\n- name: dependencies\n  description: Pull requests that change a dependency file\n  color: 00DFC8\n- name: workflow\n  description: Pull requests that change workflow files\n  color: 00DFC8\n# Orange\n- name: api\n  description: Pull requests that change bin, cli commands or API\n  color: FE634E\n# Red\n- name: security\n  description: Pull requests that address a security vulnerability\n  color: E20338\n- name: bug\n  description: Bug reporting\n  color: E20338\n\n"
  },
  {
    "path": ".husky/commit-msg",
    "hash": "abb0e8d96a2dd825dcee9e8e83e38e2f3c894f37bb80dc3a3de12ef6e3e02d37",
    "merge": true,
    "executable": true,
    "type": "text",
    "content": "#!/bin/sh\n. \"$(dirname \"$0\")/_/husky.sh\"\n\nnode --experimental-specifier-resolution=node node_modules/.bin/changelog lint --message $1\n"
  },
  {
    "path": ".husky/pre-commit",
    "hash": "69fd90cda673a7b3515ee659be424758b2f5b1e9fd44582770c26b274303ff91",
    "merge": false,
    "executable": true,
    "type": "text",
    "content": "#!/bin/sh\n. \"$(dirname \"$0\")/_/husky.sh\"\n\nnpm run lint\nnpm run test\n"
  },
  {
    "path": ".vscode/cspell.json",
    "hash": "92f9b3d5eb95f912d954b0bdae7ecb18eb0e4fc686182ded5195b74820496671",
    "merge": [
      "words"
    ],
    "executable": false,
    "type": "json",
    "content": "{\n  \"language\": \"en\",\n  \"words\": [\n    \"codecov\",\n    \"dependabot\",\n    \"ghinfo\",\n    \"keindev\",\n    \"mediainfo\",\n    \"npmignore\",\n    \"opensource\",\n    \"tagproject\",\n    \"tasktree\"\n  ]\n}\n"
  },
  {
    "path": ".vscode/launch.json",
    "hash": "09d54031e5127f700d18983c4f3856a80f5f113b25475c4e0f4c4779ecac16e8",
    "merge": [
      "configurations"
    ],
    "executable": false,
    "type": "json",
    "content": "{\n  \"version\": \"0.2.0\",\n  \"configurations\": [\n    {\n      \"name\": \"Jest\",\n      \"type\": \"node\",\n      \"request\": \"launch\",\n      \"program\": \"${workspaceFolder}/node_modules/.bin/jest\",\n      \"cwd\": \"${workspaceRoot}\",\n      \"runtimeArgs\": [\"--experimental-vm-modules\"],\n      \"args\": [\"--i\", \"--runInBand\", \"--coverage\", \"false\", \"${relativeFile}\"],\n      \"console\": \"integratedTerminal\",\n      \"internalConsoleOptions\": \"neverOpen\",\n      \"disableOptimisticBPs\": true\n    }\n  ]\n}\n"
  },
  {
    "path": ".vscode/settings.json",
    "hash": "e66ce61585ff5aaca7350ca7633224092a01b366607e32c5764d68a720090a22",
    "merge": false,
    "executable": false,
    "type": "json",
    "content": "{\n  \"typescript.tsdk\": \"./node_modules/typescript/lib\"\n}\n"
  },
  {
    "path": ".editorconfig",
    "hash": "2fc708a81febba0c704b78e2690a92459928e3c4a9206651933ebebe40c2c29c",
    "merge": false,
    "executable": false,
    "type": "text",
    "content": "root = true\n\n[*]\ninsert_final_newline = true\ncharset = utf-8\ntrim_trailing_whitespace = true\nend_of_line = lf\nmax_line_length  = 120\nindent_style = space\nindent_size = 2\n\n[*.{js}]\nindent_style = space\nindent_size = 2\n\n[*.{json}]\nindent_style = space\nindent_size = 2\n\n[*.{md,markdown}]\ntrim_trailing_whitespace = false\n"
  },
  {
    "path": ".eslintrc",
    "hash": "abbcc58c4ee61baa5a3cd69d83fdcfb24dee790b4def0a36a0ee878c98b4d9d7",
    "merge": false,
    "executable": false,
    "type": "text",
    "content": "{\n  \"root\": true,\n  \"env\": {\n    \"node\": true,\n    \"commonjs\": true\n  },\n  \"parser\": \"@typescript-eslint/parser\",\n  \"parserOptions\": {\n    \"project\": \"./tsconfig.json\",\n    \"tsconfigRootDir\": \".\"\n  },\n  \"extends\": [\n    \"eslint:recommended\",\n    \"plugin:node/recommended\",\n    \"plugin:@typescript-eslint/recommended\",\n    \"plugin:promise/recommended\",\n    \"plugin:jest/recommended\",\n    \"prettier\"\n  ],\n  \"plugins\": [\"@typescript-eslint\", \"optimize-regex\", \"jest\"],\n  \"ignorePatterns\": [\"*.cjs\", \"*.js\", \"bin/*\"],\n  \"rules\": {\n    \"@typescript-eslint/brace-style\": [\"error\", \"1tbs\"],\n    \"@typescript-eslint/explicit-function-return-type\": [\"error\", { \"allowExpressions\": true }],\n    \"@typescript-eslint/func-call-spacing\": [\"error\", \"never\"],\n    \"@typescript-eslint/indent\": [\"error\", 2, { \"SwitchCase\": 1, \"ImportDeclaration\": 2 }],\n    \"@typescript-eslint/interface-name-prefix\": \"off\",\n    \"@typescript-eslint/member-delimiter-style\": [\"error\", { \"multiline\": { \"delimiter\": \"semi\" } }],\n    \"@typescript-eslint/member-ordering\": [\n      \"error\",\n      {\n        \"classes\": {\n          \"memberTypes\": [\n            // Index signature\n            \"signature\",\n            // Fields\n            \"public-static-field\",\n            \"protected-static-field\",\n            \"private-static-field\",\n            \"public-decorated-field\",\n            \"protected-decorated-field\",\n            \"private-decorated-field\",\n            \"public-instance-field\",\n            \"protected-instance-field\",\n            \"private-instance-field\",\n            \"public-abstract-field\",\n            \"protected-abstract-field\",\n            \"private-abstract-field\",\n            \"public-field\",\n            \"protected-field\",\n            \"private-field\",\n            \"static-field\",\n            \"instance-field\",\n            \"abstract-field\",\n            \"decorated-field\",\n            \"field\",\n            // Constructors\n            \"public-constructor\",\n            \"protected-constructor\",\n            \"private-constructor\",\n            \"constructor\",\n            // Methods\n            \"public-static-method\",\n            \"protected-static-method\",\n            \"private-static-method\",\n            \"public-decorated-method\",\n            \"protected-decorated-method\",\n            \"private-decorated-method\",\n            \"public-instance-method\",\n            \"protected-instance-method\",\n            \"private-instance-method\",\n            \"public-abstract-method\",\n            \"protected-abstract-method\",\n            \"private-abstract-method\",\n            \"public-method\",\n            \"protected-method\",\n            \"private-method\",\n            \"static-method\",\n            \"instance-method\",\n            \"abstract-method\",\n            \"decorated-method\",\n            \"method\"\n          ],\n          \"order\": \"alphabetically\"\n        },\n        \"default\": {\n          \"memberTypes\": [\n            // Index signature\n            \"signature\",\n            // Fields\n            \"public-static-field\",\n            \"protected-static-field\",\n            \"private-static-field\",\n            \"public-decorated-field\",\n            \"protected-decorated-field\",\n            \"private-decorated-field\",\n            \"public-instance-field\",\n            \"protected-instance-field\",\n            \"private-instance-field\",\n            \"public-abstract-field\",\n            \"protected-abstract-field\",\n            \"private-abstract-field\",\n            \"public-field\",\n            \"protected-field\",\n            \"private-field\",\n            \"static-field\",\n            \"instance-field\",\n            \"abstract-field\",\n            \"decorated-field\",\n            \"field\",\n            // Constructors\n            \"public-constructor\",\n            \"protected-constructor\",\n            \"private-constructor\",\n            \"constructor\",\n            // Getters\n            \"public-static-get\",\n            \"protected-static-get\",\n            \"private-static-get\",\n            \"public-decorated-get\",\n            \"protected-decorated-get\",\n            \"private-decorated-get\",\n            \"public-instance-get\",\n            \"protected-instance-get\",\n            \"private-instance-get\",\n            \"public-abstract-get\",\n            \"protected-abstract-get\",\n            \"private-abstract-get\",\n            \"public-get\",\n            \"protected-get\",\n            \"private-get\",\n            \"static-get\",\n            \"instance-get\",\n            \"abstract-get\",\n            \"decorated-get\",\n            \"get\",\n            // Setters\n            \"public-static-set\",\n            \"protected-static-set\",\n            \"private-static-set\",\n            \"public-decorated-set\",\n            \"protected-decorated-set\",\n            \"private-decorated-set\",\n            \"public-instance-set\",\n            \"protected-instance-set\",\n            \"private-instance-set\",\n            \"public-abstract-set\",\n            \"protected-abstract-set\",\n            \"private-abstract-set\",\n            \"public-set\",\n            \"protected-set\",\n            \"private-set\",\n            \"static-set\",\n            \"instance-set\",\n            \"abstract-set\",\n            \"decorated-set\",\n            \"set\",\n            // Methods\n            \"public-static-method\",\n            \"protected-static-method\",\n            \"private-static-method\",\n            \"public-decorated-method\",\n            \"protected-decorated-method\",\n            \"private-decorated-method\",\n            \"public-instance-method\",\n            \"protected-instance-method\",\n            \"private-instance-method\",\n            \"public-abstract-method\",\n            \"protected-abstract-method\",\n            \"private-abstract-method\",\n            \"public-method\",\n            \"protected-method\",\n            \"private-method\",\n            \"static-method\",\n            \"instance-method\",\n            \"abstract-method\",\n            \"decorated-method\",\n            \"method\"\n          ],\n          \"order\": \"alphabetically\"\n        }\n      }\n    ],\n    \"@typescript-eslint/naming-convention\": [\n      \"error\",\n      { \"selector\": \"interface\", \"format\": [\"PascalCase\"], \"custom\": { \"regex\": \"^I[A-Z]\", \"match\": true } }\n    ],\n    \"@typescript-eslint/no-magic-numbers\": [\n      \"error\",\n      {\n        \"ignoreNumericLiteralTypes\": true,\n        \"ignoreEnums\": true,\n        \"enforceConst\": true,\n        \"ignoreReadonlyClassProperties\": true,\n        \"ignoreArrayIndexes\": true,\n        \"ignoreDefaultValues\": true,\n        \"ignore\": [0, 1, 2, 8, 10, 16]\n      }\n    ],\n    \"@typescript-eslint/no-parameter-properties\": \"error\",\n    \"@typescript-eslint/no-shadow\": \"error\",\n    \"@typescript-eslint/no-unnecessary-type-arguments\": \"warn\",\n    \"@typescript-eslint/no-unused-vars\": [\"error\", { \"argsIgnorePattern\": \"^_\", \"varsIgnorePattern\": \"^_$\" }],\n    \"@typescript-eslint/no-useless-constructor\": \"error\",\n    \"@typescript-eslint/prefer-for-of\": \"warn\",\n    \"@typescript-eslint/prefer-function-type\": \"warn\",\n    \"@typescript-eslint/prefer-readonly\": \"warn\",\n    \"@typescript-eslint/semi\": [\"error\"],\n    \"@typescript-eslint/unbound-method\": \"off\",\n    \"array-bracket-newline\": [\"error\", \"consistent\"],\n    \"arrow-body-style\": [\"error\", \"as-needed\"],\n    \"arrow-parens\": [\"error\", \"as-needed\"],\n    \"arrow-spacing\": \"error\",\n    \"block-scoped-var\": \"error\",\n    \"curly\": [\"error\", \"multi-line\"],\n    \"eol-last\": \"error\",\n    \"eqeqeq\": \"error\",\n    \"generator-star-spacing\": [\"error\", \"before\"],\n    \"import/extensions\": \"off\",\n    \"import/prefer-default-export\": \"off\",\n    \"indent\": \"off\",\n    \"key-spacing\": \"error\",\n    \"keyword-spacing\": \"error\",\n    \"lines-between-class-members\": \"off\",\n    \"max-classes-per-file\": [\"error\", 1],\n    \"max-len\": [\"error\", { \"code\": 120, \"ignoreComments\": true, \"ignoreRegExpLiterals\": true }],\n    \"max-lines-per-function\": [\"error\", { \"max\": 40 }],\n    \"new-parens\": \"error\",\n    \"no-alert\": \"warn\",\n    \"no-bitwise\": \"off\",\n    \"no-confusing-arrow\": [\"error\", { \"allowParens\": true }],\n    \"no-console\": \"warn\",\n    \"no-dupe-class-members\": \"off\",\n    \"no-else-return\": [\"error\", { \"allowElseIf\": false }],\n    \"no-labels\": \"error\",\n    \"no-lone-blocks\": \"error\",\n    \"no-magic-numbers\": \"off\",\n    \"no-multi-spaces\": \"error\",\n    \"no-multiple-empty-lines\": \"error\",\n    \"no-nested-ternary\": \"error\",\n    \"no-new\": \"error\",\n    \"no-new-func\": \"error\",\n    \"no-new-object\": \"error\",\n    \"no-new-wrappers\": \"error\",\n    \"no-plusplus\": \"off\",\n    \"no-return-await\": \"error\",\n    \"no-self-compare\": \"error\",\n    \"no-sequences\": \"error\",\n    \"no-shadow\": \"off\",\n    \"no-tabs\": \"error\",\n    \"no-template-curly-in-string\": \"error\",\n    \"no-throw-literal\": \"error\",\n    \"no-trailing-spaces\": \"error\",\n    \"no-underscore-dangle\": [\"error\", { \"allowAfterThis\": true }],\n    \"no-unneeded-ternary\": \"error\",\n    \"no-unused-expressions\": \"error\",\n    \"no-useless-call\": \"error\",\n    \"no-useless-computed-key\": \"error\",\n    \"no-useless-concat\": \"error\",\n    \"no-useless-rename\": \"error\",\n    \"no-useless-return\": \"error\",\n    \"no-var\": \"error\",\n    \"no-whitespace-before-property\": \"error\",\n    \"node/no-empty-function\": \"off\",\n    \"node/no-missing-import\": \"off\",\n    \"node/no-missing-require\": \"off\",\n    \"node/no-unsupported-features/es-syntax\": \"off\",\n    \"node/shebang\": \"off\",\n    \"object-curly-newline\": \"error\",\n    \"object-curly-spacing\": [\"error\", \"always\"],\n    \"object-shorthand\": [\"error\", \"always\"],\n    \"optimize-regex/optimize-regex\": \"warn\",\n    \"padding-line-between-statements\": [\n      \"error\",\n      { \"blankLine\": \"always\", \"prev\": \"*\", \"next\": \"return\" },\n      { \"blankLine\": \"always\", \"prev\": [\"const\", \"let\", \"var\"], \"next\": \"*\" },\n      { \"blankLine\": \"any\", \"prev\": [\"const\", \"let\", \"var\"], \"next\": [\"const\", \"let\", \"var\"] },\n      { \"blankLine\": \"always\", \"prev\": \"*\", \"next\": \"if\" },\n      { \"blankLine\": \"any\", \"prev\": \"if\", \"next\": \"if\" },\n      { \"blankLine\": \"always\", \"prev\": \"directive\", \"next\": \"*\" },\n      { \"blankLine\": \"any\", \"prev\": \"directive\", \"next\": \"directive\" }\n    ],\n    \"prefer-arrow-callback\": \"error\",\n    \"prefer-const\": \"error\",\n    \"prefer-destructuring\": \"error\",\n    \"prefer-promise-reject-errors\": \"error\",\n    \"promise/prefer-await-to-then\": \"error\",\n    \"quotes\": [\"warn\", \"single\", { \"avoidEscape\": true }],\n    \"radix\": \"error\",\n    \"require-atomic-updates\": \"off\",\n    \"require-await\": \"error\",\n    \"rest-spread-spacing\": [\"error\", \"never\"],\n    \"semi\": \"off\",\n    \"semi-spacing\": \"error\",\n    \"space-before-blocks\": \"error\",\n    \"space-before-function-paren\": [\"error\", { \"anonymous\": \"always\", \"named\": \"never\", \"asyncArrow\": \"always\" }],\n    \"space-in-parens\": \"error\",\n    \"space-infix-ops\": \"error\",\n    \"space-unary-ops\": \"error\",\n    \"spaced-comment\": [\"error\", \"always\"],\n    \"switch-colon-spacing\": \"error\",\n    \"template-curly-spacing\": \"error\"\n  },\n  \"overrides\": [\n    {\n      \"files\": [\"*.test.ts\", \"*.mock.ts\"],\n      \"rules\": {\n        \"@typescript-eslint/no-explicit-any\": \"off\",\n        \"@typescript-eslint/no-magic-numbers\": \"off\",\n        \"max-lines-per-function\": [\"error\", { \"max\": 200 }],\n        \"no-underscore-dangle\": \"off\"\n      }\n    }\n  ],\n  \"settings\": {\n    \"import/resolver\": {\n      \"node\": {\n        \"paths\": [\"src\"],\n        \"extensions\": [\".ts\", \".d.ts\"]\n      }\n    }\n  }\n}\n"
  },
  {
    "path": ".prettierrc",
    "hash": "e2755cf17f65d187ea0713d4b115a4266a9aac86832d64721244a27e10ec9ee7",
    "merge": false,
    "executable": false,
    "type": "text",
    "content": "{\n  \"printWidth\": 120,\n  \"singleQuote\": true,\n  \"tabWidth\": 2,\n  \"endOfLine\": \"lf\",\n  \"trailingComma\": \"es5\",\n  \"arrowParens\": \"avoid\"\n}\n"
  },
  {
    "path": "CODE_OF_CONDUCT.md",
    "hash": "358945758749b4985ac8e32398d5dd2a9cf832f06dc3f6b506225c92cb8182da",
    "merge": false,
    "executable": false,
    "type": "text",
    "content": "# Code of Conduct\n\n## Our Pledge\n\nIn the interest of fostering an open and welcoming environment, we as\ncontributors and maintainers pledge to make participation in our project and\nour community a harassment-free experience for everyone, regardless of age, body\nsize, disability, ethnicity, sex characteristics, gender identity and expression,\nlevel of experience, education, socioeconomic status, nationality, personal\nappearance, race, religion, or sexual identity and orientation.\n\n## Our Standards\n\nExamples of behavior that contributes to creating a positive environment\ninclude:\n\n- Using welcoming and inclusive language\n- Being respectful of differing viewpoints and experiences\n- Gracefully accepting constructive criticism\n- Focusing on what is best for the community\n- Showing empathy towards other community members\n\nExamples of unacceptable behavior by participants include:\n\n- The use of sexualized language or imagery and unwelcome sexual attention or\n  advances\n- Trolling, insulting/derogatory comments, and personal or political attacks\n- Public or private harassment\n- Publishing others' private information, such as a physical or electronic\n  address, without explicit permission\n- Other conduct which could reasonably be considered inappropriate in a\n  professional setting\n\n## Our Responsibilities\n\nProject maintainers are responsible for clarifying the standards of acceptable\nbehavior and are expected to take appropriate and fair corrective action in\nresponse to any instances of unacceptable behavior.\n\nProject maintainers have the right and responsibility to remove, edit, or\nreject comments, commits, code, wiki edits, issues, and other contributions\nthat are not aligned to this Code of Conduct, or to ban temporarily or\npermanently any contributor for other behaviors that they deem inappropriate,\nthreatening, offensive, or harmful.\n\n## Scope\n\nThis Code of Conduct applies within all project spaces, and it also applies when\nan individual is representing the project or its community in public spaces.\nExamples of representing a project or community include using an official\nproject e-mail address, posting via an official social media account, or acting\nas an appointed representative at an online or offline event. Representation of\na project may be further defined and clarified by project maintainers.\n\nThis Code of Conduct also applies outside the project spaces when there is a\nreasonable belief that an individual's behavior may have a negative impact on\nthe project or its community.\n\n## Enforcement\n\nInstances of abusive, harassing, or otherwise unacceptable behavior may be\nreported by contacting the project team at <opensource-conduct@tagproject.ru>. All\ncomplaints will be reviewed and investigated and will result in a response that\nis deemed necessary and appropriate to the circumstances. The project team is\nobligated to maintain confidentiality with regard to the reporter of an incident.\nFurther details of specific enforcement policies may be posted separately.\n\nProject maintainers who do not follow or enforce the Code of Conduct in good\nfaith may face temporary or permanent repercussions as determined by other\nmembers of the project's leadership.\n\n## Attribution\n\nThis Code of Conduct is adapted from the [Contributor Covenant](https://www.contributor-covenant.org).\n\nFor answers to common questions about this code of conduct, see [FAQ](https://www.contributor-covenant.org/faq).\n"
  },
  {
    "path": "codecov.yml",
    "hash": "0b149175f6c1ee283cec9367a3575b178e03c3c05a999c59d94f54cbc0feffff",
    "merge": false,
    "executable": false,
    "type": "yaml",
    "content": "codecov:\n  max_report_age: off\ncoverage:\n  precision: 2\n  round: down\n  status:\n    project:\n      default:\n        enabled: no\n        threshold: 0.2\n        if_not_found: success\n    patch:\n      default:\n        enabled: no\n        if_not_found: success\n    changes:\n      default:\n        enabled: no\n        if_not_found: success\n"
  },
  {
    "path": "jest.config.js",
    "hash": "298808761c240eed7d8bef6d368c2c1166eb14d4df8d915badddc06856ac9255",
    "merge": false,
    "executable": false,
    "type": "text",
    "content": "export default {\n  preset: 'ts-jest/presets/default-esm',\n  extensionsToTreatAsEsm: ['.ts'],\n  collectCoverage: true,\n  coverageReporters: ['text-summary', 'lcov'],\n  testRegex: '(/__tests__/.*|(\\\\.|/)(test))\\\\.(tsx?)$',\n  testPathIgnorePatterns: ['<rootDir>/lib/', '<rootDir>/node_modules/'],\n  transform: {},\n  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],\n  modulePathIgnorePatterns: ['<rootDir>/lib'],\n  globals: {\n    'ts-jest': {\n      useESM: true,\n    },\n  },\n};\n"
  },
  {
    "path": "SECURITY.md",
    "hash": "9d8514d986ed5c7bd98c2546ddb5fe38d3c166b079afdb4638d60fdbfd57c7a6",
    "merge": false,
    "executable": false,
    "type": "text",
    "content": "# Reporting Security Issues\n\nPlease report (suspected) security vulnerabilities to <security@tagproject.ru>. You will receive a response from us within 48 hours. If the issue is confirmed, we will release a patch as soon as possible depending on complexity but historically within a few days.\n"
  },
  {
    "path": "tsconfig.json",
    "hash": "8e302554c9f02d454d0c54a1a2019a82146eec5d32112df31f97b4e06b710acb",
    "merge": false,
    "executable": false,
    "type": "json",
    "content": "{\n  \"compilerOptions\": {\n    \"target\": \"es2020\",\n    \"module\": \"es2020\",\n    \"moduleResolution\": \"node\",\n    \"outDir\": \"lib\",\n    \"newLine\": \"lf\",\n    \"allowSyntheticDefaultImports\": true,\n    \"allowUnreachableCode\": false,\n    \"allowJs\": true,\n    \"declaration\": true,\n    \"esModuleInterop\": true,\n    \"incremental\": false,\n    \"noFallthroughCasesInSwitch\": true,\n    \"noImplicitReturns\": true,\n    \"noUncheckedIndexedAccess\": true,\n    \"noUnusedLocals\": true,\n    \"noUnusedParameters\": true,\n    \"preserveConstEnums\": true,\n    \"removeComments\": true,\n    \"resolveJsonModule\": true,\n    \"strict\": true\n  },\n  \"exclude\": [\"node_modules\", \"bin\"],\n  \"include\": [\"src/**/*\"]\n}\n"
  },
  {
    "path": ".gitignore",
    "hash": "d194cf5c2917622e0cfcdd94e1b16ff21e90c0795b6a4f612af0fc105a727456",
    "merge": true,
    "executable": false,
    "type": "glob",
    "content": "*.log\n*.pid\n*.pid.lock\n*.seed\n*.tgz\n.editorconfig\n.env\n.eslintcache\n.eslintignore\n.eslintrc\n.prettierignore\n.prettierrc\n.yarn-integrity\n/.husky/\n/.vscode/\ncoverage\njest.config.js\nlib\nlogs\nnode_modules/\npids\ntsconfig.json\ntsconfig.tsbuildinfo\nyarn-debug.log*\nyarn-error.log*"
  },
  {
    "path": ".npmignore",
    "hash": "4311ca8a8be0c1a9e4fe05ad84ca22e6dcea4e87aeb2917435ad6717802116d4",
    "merge": true,
    "executable": false,
    "type": "glob",
    "content": "**/__mocks__/**\n**/__tests__/**\n.changelogrc.yml\n.config\n.editorconfig\n.env\n.eslintignore\n.eslintrc\n.ghinfo\n.gitattributes\n.github\n.husky\n.prettierignore\n.prettierrc\n.vscode\nCODE_OF_CONDUCT.md\ncodecov.yml\ncodegen.yml\ncoverage/\ndocs/\nexample/\njest.config.js\nmedia/\nnode_modules/\nsrc/\ntsconfig.json"
  },
  {
    "path": ".eslintignore",
    "hash": "27d71a23ff5de00bce5f77320d1f0e4dfc32a9d708dcc20ab80b0a592317262e",
    "merge": false,
    "executable": false,
    "type": "glob",
    "content": "*.gql\n*.js\n__generated__\nlib"
  },
  {
    "path": ".prettierignore",
    "hash": "8f4fe2729d881ad860c93f7af99aaf12e72ba7aba8d0c3960b3b424ddf269f49",
    "merge": false,
    "executable": false,
    "type": "glob",
    "content": "lib/"
  }
]