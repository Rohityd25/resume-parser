/**
 * Comprehensive skills dictionary for rule-based extraction.
 * Organized by category for better matching and analysis.
 * Each skill has a canonical name and common aliases/variations.
 */

const SKILLS_DATABASE = {
  // ─── Programming Languages ────────────────────────────────────
  programming_languages: {
    category: "Programming Languages",
    skills: [
      { name: "JavaScript", aliases: ["js", "javascript", "ecmascript", "es6", "es2015", "es2020"] },
      { name: "TypeScript", aliases: ["ts", "typescript"] },
      { name: "Python", aliases: ["python", "python3", "py"] },
      { name: "Java", aliases: ["java", "j2ee", "j2se"] },
      { name: "C++", aliases: ["c++", "cpp", "c plus plus"] },
      { name: "C#", aliases: ["c#", "csharp", "c sharp", "c-sharp"] },
      { name: "C", aliases: ["c programming", "ansi c"] },
      { name: "Go", aliases: ["go", "golang"] },
      { name: "Rust", aliases: ["rust", "rustlang"] },
      { name: "Ruby", aliases: ["ruby"] },
      { name: "PHP", aliases: ["php"] },
      { name: "Swift", aliases: ["swift"] },
      { name: "Kotlin", aliases: ["kotlin"] },
      { name: "Scala", aliases: ["scala"] },
      { name: "R", aliases: ["r programming", "r language", "r-lang"] },
      { name: "Perl", aliases: ["perl"] },
      { name: "Dart", aliases: ["dart"] },
      { name: "Lua", aliases: ["lua"] },
      { name: "Haskell", aliases: ["haskell"] },
      { name: "Elixir", aliases: ["elixir"] },
      { name: "Clojure", aliases: ["clojure"] },
      { name: "Objective-C", aliases: ["objective-c", "objc", "obj-c"] },
      { name: "MATLAB", aliases: ["matlab"] },
      { name: "Shell Scripting", aliases: ["shell", "bash", "sh", "zsh", "shell scripting", "bash scripting"] },
      { name: "SQL", aliases: ["sql", "structured query language"] },
      { name: "Groovy", aliases: ["groovy"] },
    ],
  },

  // ─── Frontend Frameworks & Libraries ──────────────────────────
  frontend: {
    category: "Frontend",
    skills: [
      { name: "React", aliases: ["react", "reactjs", "react.js", "react js"] },
      { name: "Angular", aliases: ["angular", "angularjs", "angular.js", "angular2", "angular 2+"] },
      { name: "Vue.js", aliases: ["vue", "vuejs", "vue.js", "vue js"] },
      { name: "Next.js", aliases: ["next", "nextjs", "next.js"] },
      { name: "Nuxt.js", aliases: ["nuxt", "nuxtjs", "nuxt.js"] },
      { name: "Svelte", aliases: ["svelte", "sveltekit"] },
      { name: "jQuery", aliases: ["jquery"] },
      { name: "Redux", aliases: ["redux", "react-redux"] },
      { name: "HTML", aliases: ["html", "html5"] },
      { name: "CSS", aliases: ["css", "css3"] },
      { name: "SASS", aliases: ["sass", "scss"] },
      { name: "LESS", aliases: ["less"] },
      { name: "Tailwind CSS", aliases: ["tailwind", "tailwindcss", "tailwind css"] },
      { name: "Bootstrap", aliases: ["bootstrap"] },
      { name: "Material UI", aliases: ["material ui", "mui", "material-ui", "material design"] },
      { name: "Webpack", aliases: ["webpack"] },
      { name: "Vite", aliases: ["vite", "vitejs"] },
      { name: "Ember.js", aliases: ["ember", "emberjs", "ember.js"] },
      { name: "Gatsby", aliases: ["gatsby", "gatsbyjs"] },
      { name: "Backbone.js", aliases: ["backbone", "backbonejs", "backbone.js"] },
      { name: "Storybook", aliases: ["storybook"] },
      { name: "Three.js", aliases: ["three.js", "threejs"] },
      { name: "D3.js", aliases: ["d3", "d3.js", "d3js"] },
    ],
  },

  // ─── Backend Frameworks & Libraries ───────────────────────────
  backend: {
    category: "Backend",
    skills: [
      { name: "Node.js", aliases: ["node", "nodejs", "node.js", "node js"] },
      { name: "Express", aliases: ["express", "expressjs", "express.js"] },
      { name: "Spring Boot", aliases: ["spring boot", "springboot", "spring-boot"] },
      { name: "Spring", aliases: ["spring", "spring framework"] },
      { name: "Django", aliases: ["django"] },
      { name: "Flask", aliases: ["flask"] },
      { name: "FastAPI", aliases: ["fastapi", "fast api", "fast-api"] },
      { name: "Ruby on Rails", aliases: ["rails", "ruby on rails", "ror"] },
      { name: "ASP.NET", aliases: ["asp.net", "aspnet", "asp net", ".net", "dotnet"] },
      { name: "NestJS", aliases: ["nestjs", "nest.js", "nest"] },
      { name: "Laravel", aliases: ["laravel"] },
      { name: "Gin", aliases: ["gin", "gin-gonic"] },
      { name: "Fiber", aliases: ["fiber", "gofiber"] },
      { name: "Koa", aliases: ["koa", "koajs"] },
      { name: "Hapi", aliases: ["hapi", "hapijs"] },
      { name: "GraphQL", aliases: ["graphql", "graph ql"] },
      { name: "REST API", aliases: ["rest", "restful", "rest api", "restful api", "rest apis"] },
      { name: "gRPC", aliases: ["grpc", "g-rpc"] },
      { name: "Microservices", aliases: ["microservices", "micro services", "microservice architecture"] },
    ],
  },

  // ─── Databases ────────────────────────────────────────────────
  databases: {
    category: "Databases",
    skills: [
      { name: "MySQL", aliases: ["mysql"] },
      { name: "PostgreSQL", aliases: ["postgresql", "postgres", "pg"] },
      { name: "MongoDB", aliases: ["mongodb", "mongo"] },
      { name: "Redis", aliases: ["redis"] },
      { name: "SQLite", aliases: ["sqlite", "sqlite3"] },
      { name: "Oracle", aliases: ["oracle", "oracle db", "oracle database"] },
      { name: "SQL Server", aliases: ["sql server", "mssql", "ms sql", "microsoft sql server"] },
      { name: "Cassandra", aliases: ["cassandra", "apache cassandra"] },
      { name: "DynamoDB", aliases: ["dynamodb", "dynamo db", "aws dynamodb"] },
      { name: "Firebase", aliases: ["firebase", "firestore", "firebase firestore"] },
      { name: "Elasticsearch", aliases: ["elasticsearch", "elastic search", "elastic"] },
      { name: "Neo4j", aliases: ["neo4j", "neo 4j"] },
      { name: "CouchDB", aliases: ["couchdb", "couch db"] },
      { name: "MariaDB", aliases: ["mariadb", "maria db"] },
      { name: "Supabase", aliases: ["supabase"] },
    ],
  },

  // ─── DevOps & Cloud ───────────────────────────────────────────
  devops_cloud: {
    category: "DevOps & Cloud",
    skills: [
      { name: "Docker", aliases: ["docker", "dockerfile", "docker-compose", "docker compose"] },
      { name: "Kubernetes", aliases: ["kubernetes", "k8s", "kube"] },
      { name: "AWS", aliases: ["aws", "amazon web services"] },
      { name: "Azure", aliases: ["azure", "microsoft azure", "ms azure"] },
      { name: "GCP", aliases: ["gcp", "google cloud", "google cloud platform"] },
      { name: "Jenkins", aliases: ["jenkins"] },
      { name: "CI/CD", aliases: ["ci/cd", "cicd", "ci cd", "continuous integration", "continuous deployment"] },
      { name: "Terraform", aliases: ["terraform"] },
      { name: "Ansible", aliases: ["ansible"] },
      { name: "Nginx", aliases: ["nginx"] },
      { name: "Apache", aliases: ["apache", "apache http"] },
      { name: "Linux", aliases: ["linux", "ubuntu", "centos", "redhat", "debian"] },
      { name: "Git", aliases: ["git"] },
      { name: "GitHub", aliases: ["github"] },
      { name: "GitLab", aliases: ["gitlab"] },
      { name: "Bitbucket", aliases: ["bitbucket"] },
      { name: "Helm", aliases: ["helm", "helm charts"] },
      { name: "Prometheus", aliases: ["prometheus"] },
      { name: "Grafana", aliases: ["grafana"] },
      { name: "ELK Stack", aliases: ["elk", "elk stack", "logstash", "kibana"] },
      { name: "Heroku", aliases: ["heroku"] },
      { name: "Vercel", aliases: ["vercel"] },
      { name: "Netlify", aliases: ["netlify"] },
      { name: "DigitalOcean", aliases: ["digitalocean", "digital ocean"] },
    ],
  },

  // ─── Data Science & ML ────────────────────────────────────────
  data_science: {
    category: "Data Science & ML",
    skills: [
      { name: "Machine Learning", aliases: ["machine learning", "ml"] },
      { name: "Deep Learning", aliases: ["deep learning", "dl"] },
      { name: "TensorFlow", aliases: ["tensorflow", "tf"] },
      { name: "PyTorch", aliases: ["pytorch", "torch"] },
      { name: "Scikit-learn", aliases: ["scikit-learn", "sklearn", "scikit learn"] },
      { name: "Pandas", aliases: ["pandas"] },
      { name: "NumPy", aliases: ["numpy"] },
      { name: "Keras", aliases: ["keras"] },
      { name: "NLP", aliases: ["nlp", "natural language processing"] },
      { name: "Computer Vision", aliases: ["computer vision", "cv", "image processing"] },
      { name: "Data Analysis", aliases: ["data analysis", "data analytics"] },
      { name: "Data Visualization", aliases: ["data visualization", "data viz"] },
      { name: "Tableau", aliases: ["tableau"] },
      { name: "Power BI", aliases: ["power bi", "powerbi"] },
      { name: "Apache Spark", aliases: ["spark", "apache spark", "pyspark"] },
      { name: "Hadoop", aliases: ["hadoop", "apache hadoop"] },
      { name: "Jupyter", aliases: ["jupyter", "jupyter notebook", "jupyter notebooks"] },
    ],
  },

  // ─── Mobile Development ───────────────────────────────────────
  mobile: {
    category: "Mobile Development",
    skills: [
      { name: "React Native", aliases: ["react native", "react-native"] },
      { name: "Flutter", aliases: ["flutter"] },
      { name: "Android", aliases: ["android", "android development", "android sdk"] },
      { name: "iOS", aliases: ["ios", "ios development"] },
      { name: "Xamarin", aliases: ["xamarin"] },
      { name: "Ionic", aliases: ["ionic"] },
      { name: "SwiftUI", aliases: ["swiftui", "swift ui"] },
      { name: "Jetpack Compose", aliases: ["jetpack compose", "compose"] },
    ],
  },

  // ─── Message Queues & Streaming ───────────────────────────────
  messaging: {
    category: "Messaging & Streaming",
    skills: [
      { name: "Kafka", aliases: ["kafka", "apache kafka"] },
      { name: "RabbitMQ", aliases: ["rabbitmq", "rabbit mq"] },
      { name: "Apache ActiveMQ", aliases: ["activemq", "active mq"] },
      { name: "AWS SQS", aliases: ["sqs", "aws sqs", "amazon sqs"] },
      { name: "NATS", aliases: ["nats"] },
      { name: "ZeroMQ", aliases: ["zeromq", "zmq"] },
    ],
  },

  // ─── Testing ──────────────────────────────────────────────────
  testing: {
    category: "Testing",
    skills: [
      { name: "Jest", aliases: ["jest"] },
      { name: "Mocha", aliases: ["mocha"] },
      { name: "Jasmine", aliases: ["jasmine"] },
      { name: "Cypress", aliases: ["cypress"] },
      { name: "Selenium", aliases: ["selenium", "selenium webdriver"] },
      { name: "JUnit", aliases: ["junit"] },
      { name: "TestNG", aliases: ["testng"] },
      { name: "Pytest", aliases: ["pytest"] },
      { name: "Playwright", aliases: ["playwright"] },
      { name: "Puppeteer", aliases: ["puppeteer"] },
      { name: "Postman", aliases: ["postman"] },
    ],
  },

  // ─── Tools & Miscellaneous ────────────────────────────────────
  tools: {
    category: "Tools & Others",
    skills: [
      { name: "Jira", aliases: ["jira"] },
      { name: "Confluence", aliases: ["confluence"] },
      { name: "Slack", aliases: ["slack"] },
      { name: "Figma", aliases: ["figma"] },
      { name: "Adobe XD", aliases: ["adobe xd", "xd"] },
      { name: "Sketch", aliases: ["sketch"] },
      { name: "VS Code", aliases: ["vs code", "vscode", "visual studio code"] },
      { name: "IntelliJ", aliases: ["intellij", "intellij idea"] },
      { name: "Eclipse", aliases: ["eclipse"] },
      { name: "Agile", aliases: ["agile", "agile methodology", "agile methodologies"] },
      { name: "Scrum", aliases: ["scrum"] },
      { name: "Kanban", aliases: ["kanban"] },
      { name: "OAuth", aliases: ["oauth", "oauth2", "oauth 2.0"] },
      { name: "JWT", aliases: ["jwt", "json web token", "json web tokens"] },
      { name: "WebSocket", aliases: ["websocket", "websockets", "web socket", "web sockets", "socket.io"] },
      { name: "SOAP", aliases: ["soap"] },
      { name: "XML", aliases: ["xml"] },
      { name: "JSON", aliases: ["json"] },
      { name: "YAML", aliases: ["yaml", "yml"] },
      { name: "Swagger", aliases: ["swagger", "openapi", "open api"] },
      { name: "Maven", aliases: ["maven", "apache maven"] },
      { name: "Gradle", aliases: ["gradle"] },
      { name: "npm", aliases: ["npm"] },
      { name: "Yarn", aliases: ["yarn"] },
      { name: "pnpm", aliases: ["pnpm"] },
      { name: "Hibernate", aliases: ["hibernate"] },
      { name: "Sequelize", aliases: ["sequelize"] },
      { name: "Mongoose", aliases: ["mongoose"] },
      { name: "Prisma", aliases: ["prisma"] },
      { name: "TypeORM", aliases: ["typeorm"] },
    ],
  },
};

/**
 * Build a flat lookup map: alias → canonical skill name.
 * This is computed once at module load for O(1) lookups.
 */
function buildSkillsLookup() {
  const lookup = new Map();
  for (const category of Object.values(SKILLS_DATABASE)) {
    for (const skill of category.skills) {
      // Map the canonical name (lowercased)
      lookup.set(skill.name.toLowerCase(), skill.name);
      // Map each alias
      for (const alias of skill.aliases) {
        lookup.set(alias.toLowerCase(), skill.name);
      }
    }
  }
  return lookup;
}

/**
 * Build a flat array of all canonical skill names.
 */
function getAllSkillNames() {
  const names = [];
  for (const category of Object.values(SKILLS_DATABASE)) {
    for (const skill of category.skills) {
      names.push(skill.name);
    }
  }
  return names;
}

const SKILLS_LOOKUP = buildSkillsLookup();
const ALL_SKILL_NAMES = getAllSkillNames();

module.exports = {
  SKILLS_DATABASE,
  SKILLS_LOOKUP,
  ALL_SKILL_NAMES,
  buildSkillsLookup,
  getAllSkillNames,
};
