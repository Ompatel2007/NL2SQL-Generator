"use client";

interface LearnViewProps {
  onBackToWorkspace: () => void;
}

export function LearnView({ onBackToWorkspace }: LearnViewProps) {
  return (
    <main
      className="flex-1 flex flex-col p-4 md:p-8 overflow-y-auto max-w-5xl mx-auto w-full leading-relaxed"
      style={{ color: "var(--foreground)" }}
      aria-label="Learn section: Natural Language to SQL & DBMS Fundamentals"
    >
      {/* Top Header / Breadcrumb */}
      <div
        className="flex flex-wrap items-center justify-between gap-4 pb-4 mb-8 border-b"
        style={{ borderColor: "var(--border)" }}
      >
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded border"
              style={{
                background: "var(--surface-subtle)",
                borderColor: "var(--accent)",
                color: "var(--accent)",
              }}
            >
              Academic Guide &amp; Curriculum
            </span>
            <span className="text-xs opacity-70" style={{ color: "var(--muted)" }}>
              Relational DBMS Engine Internals &amp; NLP→SQL Semantic Parsing
            </span>
          </div>
          <h1
            className="text-xl md:text-3xl font-bold tracking-tight"
            style={{ color: "var(--foreground)" }}
          >
            Natural Language to SQL (NL→SQL) &amp; DBMS Architecture
          </h1>
          <p className="text-xs md:text-sm opacity-80 mt-1" style={{ color: "var(--muted)" }}>
            An in-depth academic curriculum covering conversational database querying, relational algebra, query compilation, cost-based optimization, and storage engine execution.
          </p>
        </div>

        <button
          type="button"
          onClick={onBackToWorkspace}
          className="px-3.5 py-2 rounded-lg text-xs md:text-sm font-semibold border transition-all cursor-pointer shadow-xs hover:opacity-90 flex items-center gap-2"
          style={{
            background: "var(--surface-subtle)",
            borderColor: "var(--border)",
            color: "var(--foreground)",
          }}
        >
          <svg
            className="w-4 h-4 opacity-80"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          <span>Back to Workspace</span>
        </button>
      </div>

      {/* Main Educational Content */}
      <div className="space-y-8">
        {/* Section 1: What is Natural Language? */}
        <section
          className="panel p-5 rounded-xl border space-y-2.5"
          style={{ background: "var(--panel)", borderColor: "var(--border)" }}
        >
          <h2 className="text-base md:text-lg font-bold flex items-center gap-2" style={{ color: "var(--foreground)" }}>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-[var(--surface-subtle)] text-[var(--accent)] border border-[var(--border)]">01</span>
            What is Natural Language?
          </h2>
          <p className="text-xs md:text-sm opacity-90 leading-relaxed">
            Natural language refers to human communication (e.g. English, Spanish, Hindi) that evolved organically over millennia through human discourse. Unlike programming languages or formal query grammars, natural language is:
          </p>
          <ul className="list-disc list-inside text-xs md:text-sm opacity-85 space-y-1 pl-1">
            <li><strong>Semantically Ambiguous:</strong> Words and sentences often have multiple meanings depending on context, tone, or colloquial usage.</li>
            <li><strong>Syntactically Flexible:</strong> The same underlying information need can be phrased in dozens of distinct ways (e.g. &ldquo;Find customers from Mumbai&rdquo; vs. &ldquo;Who lives in Mumbai?&rdquo;).</li>
            <li><strong>Implicit in Context:</strong> Humans frequently omit obvious presuppositions, entity names, or join relationships that a computer requires for exact relational retrieval.</li>
          </ul>
        </section>

        {/* Section 2: What is NLP? */}
        <section
          className="panel p-5 rounded-xl border space-y-2.5"
          style={{ background: "var(--panel)", borderColor: "var(--border)" }}
        >
          <h2 className="text-base md:text-lg font-bold flex items-center gap-2" style={{ color: "var(--foreground)" }}>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-[var(--surface-subtle)] text-[var(--accent)] border border-[var(--border)]">02</span>
            What is Natural Language Processing (NLP)?
          </h2>
          <p className="text-xs md:text-sm opacity-90 leading-relaxed">
            Natural Language Processing (NLP) is an interdisciplinary field of Artificial Intelligence, Computer Science, and Computational Linguistics. Its goal is to enable computers to understand, interpret, extract, and generate human language in computationally rigorous ways.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            <div className="p-3 rounded-lg border bg-[var(--surface-subtle)]" style={{ borderColor: "var(--border)" }}>
              <h3 className="font-semibold text-xs md:text-sm mb-1 text-[var(--accent)]">Core Linguistic Pipeline</h3>
              <ul className="list-disc list-inside text-xs opacity-85 space-y-1">
                <li><strong>Tokenization:</strong> Segmenting input strings into discrete word and punctuation tokens.</li>
                <li><strong>Part-of-Speech (POS) Tagging:</strong> Labeling nouns, verbs, prepositions, and adjectives.</li>
                <li><strong>Named Entity Recognition (NER):</strong> Extracting real-world entities (names, cities, dates, amounts).</li>
                <li><strong>Dependency Parsing:</strong> Constructing syntactic grammatical trees showing governor-dependent relationships.</li>
              </ul>
            </div>
            <div className="p-3 rounded-lg border bg-[var(--surface-subtle)]" style={{ borderColor: "var(--border)" }}>
              <h3 className="font-semibold text-xs md:text-sm mb-1 text-[var(--accent)]">Transformer Neural Architectures</h3>
              <p className="text-xs opacity-85 leading-relaxed">
                Modern NLP is powered by Self-Attention Transformers (Vaswani et al.) and Large Language Models (LLMs) such as Google Gemini, which represent words as dense continuous vector embeddings, capturing contextual relationships across long sequences.
              </p>
            </div>
          </div>
        </section>

        {/* Section 3: What is SQL? */}
        <section
          className="panel p-5 rounded-xl border space-y-2.5"
          style={{ background: "var(--panel)", borderColor: "var(--border)" }}
        >
          <h2 className="text-base md:text-lg font-bold flex items-center gap-2" style={{ color: "var(--foreground)" }}>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-[var(--surface-subtle)] text-[var(--accent)] border border-[var(--border)]">03</span>
            What is SQL?
          </h2>
          <p className="text-xs md:text-sm opacity-90 leading-relaxed">
            Structured Query Language (SQL) is the international standard (ANSI/ISO 9075) language used to manage, manipulate, and query relational databases. Conceived by Donald D. Chamberlin and Raymond F. Boyce in the early 1970s, it operationalizes Edgar F. Codd&apos;s relational model:
          </p>
          <ul className="list-disc list-inside text-xs md:text-sm opacity-85 space-y-1 pl-1">
            <li><strong>Declarative Nature:</strong> In SQL, a query specifies <em>what</em> output relation is desired, not <em>how</em> to physically retrieve it from disk or traverse index trees.</li>
            <li><strong>Relational Abstractions:</strong> Data is organized into <em>Relations</em> (tables), consisting of <em>Tuples</em> (rows) and <em>Attributes</em> (columns) bound by strict <em>Domains</em> (data types).</li>
            <li><strong>Mathematical Rigor:</strong> SQL clauses directly implement the mathematical operators of First-Order Predicate Logic and Relational Algebra.</li>
          </ul>
        </section>

        {/* Section 4: What is Natural Language to SQL? */}
        <section
          className="panel p-5 rounded-xl border space-y-2.5"
          style={{ background: "var(--panel)", borderColor: "var(--border)" }}
        >
          <h2 className="text-base md:text-lg font-bold flex items-center gap-2" style={{ color: "var(--foreground)" }}>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-[var(--surface-subtle)] text-[var(--accent)] border border-[var(--border)]">04</span>
            What is Natural Language to SQL (NL→SQL)?
          </h2>
          <p className="text-xs md:text-sm opacity-90 leading-relaxed">
            Natural Language to SQL (Text-to-SQL) is an automated semantic parsing task where a user&apos;s natural language query is translated into a syntactically valid and semantically executable SQL query against a target database schema catalog.
          </p>
          <p className="text-xs md:text-sm opacity-85 leading-relaxed">
            It eliminates the need for users to master SQL syntax, table relationships, foreign keys, or relational algebra operators, enabling conversational data access.
          </p>
        </section>

        {/* Section 5: Why NL→SQL is Useful */}
        <section
          className="panel p-5 rounded-xl border space-y-2.5"
          style={{ background: "var(--panel)", borderColor: "var(--border)" }}
        >
          <h2 className="text-base md:text-lg font-bold flex items-center gap-2" style={{ color: "var(--foreground)" }}>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-[var(--surface-subtle)] text-[var(--accent)] border border-[var(--border)]">05</span>
            Why NL→SQL is Useful
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            <div className="p-3 rounded-lg border bg-[var(--surface-subtle)]" style={{ borderColor: "var(--border)" }}>
              <h3 className="font-semibold text-xs md:text-sm mb-1 text-emerald-400">Data Democratization</h3>
              <p className="text-xs opacity-80 leading-relaxed">
                Empowers clinicians, business executives, educators, and field researchers to query multi-gigabyte databases directly without relying on software engineers or data analysts.
              </p>
            </div>
            <div className="p-3 rounded-lg border bg-[var(--surface-subtle)]" style={{ borderColor: "var(--border)" }}>
              <h3 className="font-semibold text-xs md:text-sm mb-1 text-sky-400">Sub-Second Turnaround</h3>
              <p className="text-xs opacity-80 leading-relaxed">
                Replaces long ticket backlogs with immediate query generation and execution, transforming data exploration into an agile conversational workflow.
              </p>
            </div>
            <div className="p-3 rounded-lg border bg-[var(--surface-subtle)]" style={{ borderColor: "var(--border)" }}>
              <h3 className="font-semibold text-xs md:text-sm mb-1 text-amber-400">Voice Querying &amp; Accessibility</h3>
              <p className="text-xs opacity-80 leading-relaxed">
                Enables hands-free database interaction in mobile environments, operating theaters, warehouse floors, or for users with visual or physical typing constraints.
              </p>
            </div>
            <div className="p-3 rounded-lg border bg-[var(--surface-subtle)]" style={{ borderColor: "var(--border)" }}>
              <h3 className="font-semibold text-xs md:text-sm mb-1 text-purple-400">Pedagogical DBMS Instruction</h3>
              <p className="text-xs opacity-80 leading-relaxed">
                Allows students to see how natural phrasing maps into formal relational algebra trees, physical access paths, and relational execution plans.
              </p>
            </div>
          </div>
        </section>

        {/* Section 6: How NL→SQL Works */}
        <section
          className="panel p-5 rounded-xl border space-y-2.5"
          style={{ background: "var(--panel)", borderColor: "var(--border)" }}
        >
          <h2 className="text-base md:text-lg font-bold flex items-center gap-2" style={{ color: "var(--foreground)" }}>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-[var(--surface-subtle)] text-[var(--accent)] border border-[var(--border)]">06</span>
            How NL→SQL Works — Multi-Stage System Architecture
          </h2>
          <p className="text-xs md:text-sm opacity-90 leading-relaxed">
            A state-of-the-art NL→SQL engine coordinates multiple interconnected systems:
          </p>
          <ol className="list-decimal list-inside text-xs md:text-sm opacity-85 space-y-1.5 pl-1">
            <li><strong>Utterance Preprocessing:</strong> Normalizing speech/text, identifying keywords, and cleaning punctuation.</li>
            <li><strong>Schema Linking &amp; Grounding:</strong> Resolving natural language references to physical database tables, attributes, and foreign keys.</li>
            <li><strong>Prompt Construction &amp; Conditioning:</strong> Compiling the active database DDL catalog, types, primary keys, and demonstration examples for the neural language model.</li>
            <li><strong>Cross-Attention SQL Generation:</strong> The LLM (Gemini 2.5 Flash) predicts the token sequence representing valid SQL.</li>
            <li><strong>Grammar &amp; AST Verification:</strong> Ensuring generated syntax conforms to ANSI SQL grammar rules before dispatching to the engine.</li>
            <li><strong>Physical Execution &amp; Relational Materialization:</strong> Running the plan against table buffer pages and presenting verifiable result tuples.</li>
          </ol>
        </section>

        {/* Section 7: Step-by-Step Working with Complete Example */}
        <section
          className="panel p-5 rounded-xl border space-y-4"
          style={{ background: "var(--panel)", borderColor: "var(--border)" }}
        >
          <div>
            <h2 className="text-base md:text-lg font-bold flex items-center gap-2" style={{ color: "var(--foreground)" }}>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-[var(--surface-subtle)] text-[var(--accent)] border border-[var(--border)]">07</span>
              Step-by-Step Working of This Application
            </h2>
            <p className="text-xs md:text-sm opacity-80 mt-1">
              Visualizing the complete end-to-end transformation flow from natural language to relational output.
            </p>
          </div>

          {/* Visual Workflow Flowchart */}
          <div
            className="p-4 rounded-xl border flex flex-col items-center justify-center gap-2 text-center"
            style={{
              background: "var(--surface-subtle)",
              borderColor: "var(--border)",
            }}
          >
            <span className="font-semibold text-xs md:text-sm px-3 py-1 rounded-md bg-[var(--panel)] border text-[var(--foreground)]">
              Natural Language
            </span>
            <span className="text-base opacity-70 font-bold text-[var(--accent)]">↓</span>
            <span className="font-semibold text-xs md:text-sm px-3 py-1 rounded-md bg-[var(--panel)] border text-[var(--foreground)]">
              Understand the request
            </span>
            <span className="text-base opacity-70 font-bold text-[var(--accent)]">↓</span>
            <span className="font-semibold text-xs md:text-sm px-3 py-1 rounded-md bg-[var(--panel)] border text-[var(--foreground)]">
              Identify table and columns
            </span>
            <span className="text-base opacity-70 font-bold text-[var(--accent)]">↓</span>
            <span className="font-semibold text-xs md:text-sm px-3 py-1 rounded-md bg-[var(--panel)] border text-[var(--foreground)]">
              Generate SQL
            </span>
            <span className="text-base opacity-70 font-bold text-[var(--accent)]">↓</span>
            <span className="font-semibold text-xs md:text-sm px-3 py-1 rounded-md bg-[var(--panel)] border text-[var(--foreground)]">
              Execute SQL
            </span>
            <span className="text-base opacity-70 font-bold text-[var(--accent)]">↓</span>
            <span className="font-semibold text-xs md:text-sm px-3 py-1 rounded-md bg-[var(--panel)] border text-[var(--foreground)]">
              Display Result
            </span>
          </div>

          {/* Complete Example Demonstration */}
          <div className="space-y-3 pt-2">
            <h3 className="font-bold text-sm md:text-base" style={{ color: "var(--foreground)" }}>
              Worked Example:
            </h3>

            <div className="p-3.5 rounded-lg border bg-[var(--surface-subtle)] space-y-1" style={{ borderColor: "var(--border)" }}>
              <span className="text-xs font-semibold text-[var(--accent)] uppercase tracking-wider block">
                User Input:
              </span>
              <p className="text-sm font-medium italic" style={{ color: "var(--foreground)" }}>
                &ldquo;Show the names and cities of customers from Mumbai.&rdquo;
              </p>
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block">
                Generated SQL Query:
              </span>
              <pre
                className="p-3.5 rounded-lg border font-mono text-xs md:text-sm overflow-x-auto"
                style={{
                  background: "var(--panel)",
                  borderColor: "var(--border)",
                  color: "var(--foreground)",
                }}
              >
{`SELECT name, city
FROM customers
WHERE city = 'Mumbai';`}
              </pre>
            </div>

            {/* Explanation of SELECT, FROM, and WHERE */}
            <div className="space-y-2 pt-1">
              <h4 className="font-semibold text-xs md:text-sm" style={{ color: "var(--foreground)" }}>
                Clause-by-Clause Explanation:
              </h4>
              <ul className="space-y-2 text-xs md:text-sm opacity-90 pl-1">
                <li className="p-2.5 rounded-lg border bg-[var(--surface-subtle)]" style={{ borderColor: "var(--border)" }}>
                  <strong className="text-[var(--accent)] font-mono">SELECT name, city:</strong> Implements relational projection ($\pi$). It specifies that only the <code className="font-mono">name</code> and <code className="font-mono">city</code> attributes should be preserved in the final output tuples, discarding unrequested attributes (such as <code className="font-mono">id</code>, <code className="font-mono">email</code>, or <code className="font-mono">phone</code>) and minimizing memory bandwidth.
                </li>
                <li className="p-2.5 rounded-lg border bg-[var(--surface-subtle)]" style={{ borderColor: "var(--border)" }}>
                  <strong className="text-[var(--accent)] font-mono">FROM customers:</strong> Identifies the source relation. The storage engine references the system catalog to locate the <code className="font-mono">customers</code> table descriptor, its slotted disk pages, and initiates a sequential or indexed scan into working memory.
                </li>
                <li className="p-2.5 rounded-lg border bg-[var(--surface-subtle)]" style={{ borderColor: "var(--border)" }}>
                  <strong className="text-[var(--accent)] font-mono">WHERE city = &apos;Mumbai&apos;:</strong> Implements relational selection ($\sigma$). It establishes a boolean predicate. Each candidate tuple is evaluated against this filter; only tuples where the <code className="font-mono">city</code> attribute strictly equals <code className="font-mono">&apos;Mumbai&apos;</code> survive to the projection stage.
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section 8: NLP -> SQL Deep Dive: Semantic Parsing & Schema Linking */}
        <section
          className="panel p-5 rounded-xl border space-y-3"
          style={{ background: "var(--panel)", borderColor: "var(--border)" }}
        >
          <h2 className="text-base md:text-lg font-bold flex items-center gap-2" style={{ color: "var(--foreground)" }}>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-[var(--surface-subtle)] text-[var(--accent)] border border-[var(--border)]">08</span>
            NLP→SQL Deep Dive: Schema Linking &amp; Semantic Grounding
          </h2>
          <p className="text-xs md:text-sm opacity-90 leading-relaxed">
            Schema linking is the critical mechanism that binds unstructured conversational tokens to actual database schema elements:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            <div className="p-3 rounded-lg border bg-[var(--surface-subtle)] space-y-1.5" style={{ borderColor: "var(--border)" }}>
              <h3 className="font-bold text-xs md:text-sm text-[var(--accent)]">Types of Schema Linking</h3>
              <ul className="list-disc list-inside text-xs opacity-85 space-y-1">
                <li><strong>Table Linking:</strong> Mapping nouns like &ldquo;clients&rdquo; or &ldquo;buyers&rdquo; to the <code className="font-mono">customers</code> relation.</li>
                <li><strong>Attribute Linking:</strong> Recognizing &ldquo;cost&rdquo; or &ldquo;price&rdquo; as the column <code className="font-mono">unit_price</code>.</li>
                <li><strong>Value Grounding:</strong> Recognizing &ldquo;Mumbai&rdquo; as a string literal residing inside attribute <code className="font-mono">city</code>.</li>
                <li><strong>Condition Matching:</strong> Mapping terms like &ldquo;high-priced&rdquo; or &ldquo;expensive&rdquo; to inequalities like <code className="font-mono">price &gt; 500</code>.</li>
              </ul>
            </div>
            <div className="p-3 rounded-lg border bg-[var(--surface-subtle)] space-y-1.5" style={{ borderColor: "var(--border)" }}>
              <h3 className="font-bold text-xs md:text-sm text-[var(--accent)]">Context Pruning for Large Databases</h3>
              <p className="text-xs opacity-85 leading-relaxed">
                When enterprise databases contain hundreds of tables and thousands of columns, feeding the entire schema into a prompt exceeds context limits. Modern systems employ <em>Schema Pruning</em>: embedding-based vector similarity search selects only the top-K relevant tables and columns needed for the query.
              </p>
            </div>
          </div>
        </section>

        {/* Section 9: NLP -> SQL Deep Dive: Constrained Decoding & Execution-Guided Repair */}
        <section
          className="panel p-5 rounded-xl border space-y-3"
          style={{ background: "var(--panel)", borderColor: "var(--border)" }}
        >
          <h2 className="text-base md:text-lg font-bold flex items-center gap-2" style={{ color: "var(--foreground)" }}>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-[var(--surface-subtle)] text-[var(--accent)] border border-[var(--border)]">09</span>
            NLP→SQL Deep Dive: Constrained Decoding &amp; Self-Repair
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3 rounded-lg border bg-[var(--surface-subtle)] space-y-1.5" style={{ borderColor: "var(--border)" }}>
              <h3 className="font-bold text-xs md:text-sm text-sky-400">Grammar-Constrained Decoding</h3>
              <p className="text-xs opacity-85 leading-relaxed">
                Rather than letting the neural model predict arbitrary tokens, a Context-Free Grammar (CFG) masks out invalid tokens at each generation step. This guarantees 100% syntactically legal SQL output and eliminates unclosed parentheses, missing commas, or misplaced keywords.
              </p>
            </div>
            <div className="p-3 rounded-lg border bg-[var(--surface-subtle)] space-y-1.5" style={{ borderColor: "var(--border)" }}>
              <h3 className="font-bold text-xs md:text-sm text-emerald-400">Execution-Guided Decoding (EGD)</h3>
              <p className="text-xs opacity-85 leading-relaxed">
                The candidate query is executed against a sandbox in-memory database engine. If a runtime exception occurs (e.g. dividing by zero or ambiguous join columns), the exception stack is fed back to the LLM to self-repair the query iteratively before returning the answer.
              </p>
            </div>
          </div>
        </section>

        {/* Section 10: DBMS Deep Dive: Query Parsing, Semantic Analysis & AST */}
        <section
          className="panel p-5 rounded-xl border space-y-3"
          style={{ background: "var(--panel)", borderColor: "var(--border)" }}
        >
          <h2 className="text-base md:text-lg font-bold flex items-center gap-2" style={{ color: "var(--foreground)" }}>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-[var(--surface-subtle)] text-[var(--accent)] border border-[var(--border)]">10</span>
            DBMS Engine Internals: Parsing &amp; Abstract Syntax Trees (AST)
          </h2>
          <p className="text-xs md:text-sm opacity-90 leading-relaxed">
            When a relational database receives raw SQL text, the Query Compilation subsystem executes three fundamental tasks:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            <div className="p-3 rounded-lg border bg-[var(--surface-subtle)]" style={{ borderColor: "var(--border)" }}>
              <h3 className="font-semibold text-xs md:text-sm mb-1 text-[var(--accent)]">1. Lexical Analysis</h3>
              <p className="text-xs opacity-80 leading-relaxed">
                The lexer streams the SQL character string into a sequence of classified tokens: keywords (<code className="font-mono">SELECT</code>, <code className="font-mono">FROM</code>), identifiers (<code className="font-mono">customers</code>), operators (<code className="font-mono">=</code>), and literals.
              </p>
            </div>
            <div className="p-3 rounded-lg border bg-[var(--surface-subtle)]" style={{ borderColor: "var(--border)" }}>
              <h3 className="font-semibold text-xs md:text-sm mb-1 text-[var(--accent)]">2. Syntactic Parsing</h3>
              <p className="text-xs opacity-80 leading-relaxed">
                The parser verifies token sequences against grammar rules and compiles an Abstract Syntax Tree (AST) hierarchical data structure representing the logical tree structure of clauses.
              </p>
            </div>
            <div className="p-3 rounded-lg border bg-[var(--surface-subtle)]" style={{ borderColor: "var(--border)" }}>
              <h3 className="font-semibold text-xs md:text-sm mb-1 text-[var(--accent)]">3. Semantic Analysis</h3>
              <p className="text-xs opacity-80 leading-relaxed">
                The system consults the Data Dictionary (Catalog) to verify relation existence, check column accessibility, confirm attribute types, and resolve type coercions.
              </p>
            </div>
          </div>
        </section>

        {/* Section 11: DBMS Deep Dive: Relational Algebra & Query Tree */}
        <section
          className="panel p-5 rounded-xl border space-y-3"
          style={{ background: "var(--panel)", borderColor: "var(--border)" }}
        >
          <h2 className="text-base md:text-lg font-bold flex items-center gap-2" style={{ color: "var(--foreground)" }}>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-[var(--surface-subtle)] text-[var(--accent)] border border-[var(--border)]">11</span>
            Relational Operators &amp; Logical Query Plans
          </h2>
          <p className="text-xs md:text-sm opacity-90 leading-relaxed">
            The AST is transformed into a Logical Query Plan, which is an operator tree of Relational Algebra primitives. Each node in the tree accepts one or more relations as input and produces a relation as output:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
            <div className="p-3 rounded-lg border bg-[var(--surface-subtle)]" style={{ borderColor: "var(--border)" }}>
              <div className="font-mono font-bold text-xs text-[var(--accent)]">Selection (WHERE / Filter)</div>
              <p className="text-xs opacity-80 mt-1">Filters rows matching a boolean predicate: <code className="font-mono">Filter[city=&apos;Mumbai&apos;](customers)</code></p>
            </div>
            <div className="p-3 rounded-lg border bg-[var(--surface-subtle)]" style={{ borderColor: "var(--border)" }}>
              <div className="font-mono font-bold text-xs text-[var(--accent)]">Projection (SELECT)</div>
              <p className="text-xs opacity-80 mt-1">Extracts specified columns: <code className="font-mono">Project[name, city](customers)</code></p>
            </div>
            <div className="p-3 rounded-lg border bg-[var(--surface-subtle)]" style={{ borderColor: "var(--border)" }}>
              <div className="font-mono font-bold text-xs text-[var(--accent)]">Join (JOIN / Condition)</div>
              <p className="text-xs opacity-80 mt-1">Combines matching tuples: <code className="font-mono">Orders JOIN[cust_id=id] Customers</code></p>
            </div>
            <div className="p-3 rounded-lg border bg-[var(--surface-subtle)]" style={{ borderColor: "var(--border)" }}>
              <div className="font-mono font-bold text-xs text-[var(--accent)]">Aggregation (GROUP BY)</div>
              <p className="text-xs opacity-80 mt-1">Partitions data into buckets and calculates summaries: <code className="font-mono">GroupBy[dept, COUNT(id)](Employees)</code></p>
            </div>
            <div className="p-3 rounded-lg border bg-[var(--surface-subtle)]" style={{ borderColor: "var(--border)" }}>
              <div className="font-mono font-bold text-xs text-[var(--accent)]">Cartesian Product (CROSS JOIN)</div>
              <p className="text-xs opacity-80 mt-1">Computes every combination of tuples: <code className="font-mono">R CROSS JOIN S</code></p>
            </div>
            <div className="p-3 rounded-lg border bg-[var(--surface-subtle)]" style={{ borderColor: "var(--border)" }}>
              <div className="font-mono font-bold text-xs text-[var(--accent)]">Set Operations (UNION / EXCEPT)</div>
              <p className="text-xs opacity-80 mt-1">Union, Difference, and Intersection operations on union-compatible relations.</p>
            </div>
          </div>
        </section>

        {/* Section 12: DBMS Deep Dive: Query Optimization (Rule-Based & Cost-Based) */}
        <section
          className="panel p-5 rounded-xl border space-y-3"
          style={{ background: "var(--panel)", borderColor: "var(--border)" }}
        >
          <h2 className="text-base md:text-lg font-bold flex items-center gap-2" style={{ color: "var(--foreground)" }}>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-[var(--surface-subtle)] text-[var(--accent)] border border-[var(--border)]">12</span>
            Query Optimization: Rule-Based &amp; Cost-Based
          </h2>
          <p className="text-xs md:text-sm opacity-90 leading-relaxed">
            The Query Optimizer is the computational brain of a DBMS. It converts the declarative logical query tree into the most efficient physical execution plan:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            <div className="p-3.5 rounded-lg border bg-[var(--surface-subtle)] space-y-2" style={{ borderColor: "var(--border)" }}>
              <h3 className="font-bold text-xs md:text-sm text-amber-400">Rule-Based Heuristic Optimization (RBO)</h3>
              <p className="text-xs opacity-80 leading-relaxed">
                Applies algebraic transformation rules that are universally guaranteed to reduce computation:
              </p>
              <ul className="list-disc list-inside text-xs opacity-85 space-y-1 pl-1">
                <li><strong>Predicate Pushdown:</strong> Moving selection ($\sigma$) as close to leaf disk scans as possible. Filtering rows early avoids propagating millions of rows through joins.</li>
                <li><strong>Projection Pushdown:</strong> Moving projection ($\pi$) downward to discard unused columns, shrinking intermediate tuple width in memory.</li>
                <li><strong>Constant Folding:</strong> Evaluating deterministic expressions (e.g. <code className="font-mono">WHERE age &gt; 18 + 2</code> → <code className="font-mono">WHERE age &gt; 20</code>) at compile time.</li>
              </ul>
            </div>

            <div className="p-3.5 rounded-lg border bg-[var(--surface-subtle)] space-y-2" style={{ borderColor: "var(--border)" }}>
              <h3 className="font-bold text-xs md:text-sm text-emerald-400">Cost-Based Optimization (CBO)</h3>
              <p className="text-xs opacity-80 leading-relaxed">
                Uses catalog statistics to estimate disk I/O and CPU costs for alternative physical plans:
              </p>
              <ul className="list-disc list-inside text-xs opacity-85 space-y-1 pl-1">
                <li><strong>Catalog Statistics:</strong> Tuple count ($N$), block count ($B$), distinct values ($V(A, R)$), and histogram buckets.</li>
                <li><strong>Cardinality Estimation:</strong> Estimating intermediate result size using selectivity formulas: <code className="font-mono">Selectivity(A = c) = 1 / V(A, R)</code>.</li>
                <li><strong>Join Order Selection:</strong> Using dynamic programming (System-R algorithm) to find the cheapest join tree among thousands of permutations.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section 13: DBMS Deep Dive: Physical Operator Algorithms & Joins */}
        <section
          className="panel p-5 rounded-xl border space-y-3"
          style={{ background: "var(--panel)", borderColor: "var(--border)" }}
        >
          <h2 className="text-base md:text-lg font-bold flex items-center gap-2" style={{ color: "var(--foreground)" }}>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-[var(--surface-subtle)] text-[var(--accent)] border border-[var(--border)]">13</span>
            Physical Operator Algorithms &amp; Join Strategies
          </h2>
          <p className="text-xs md:text-sm opacity-90 leading-relaxed">
            The database engine executes operators using specialized physical algorithms. Understanding their computational complexities is central to database engineering:
          </p>
          <div className="space-y-2 pt-1 text-xs md:text-sm">
            <div className="p-3 rounded-lg border bg-[var(--surface-subtle)]" style={{ borderColor: "var(--border)" }}>
              <div className="flex items-center justify-between font-mono font-bold text-xs mb-1">
                <span className="text-sky-400">1. Nested-Loop Join (NLJ)</span>
                <span className="text-rose-400">Complexity: O(|R| × |S|)</span>
              </div>
              <p className="opacity-80 text-xs">
                For every tuple in outer relation $R$, it scans every tuple in inner relation $S$. Simple, requires minimal memory, but scales poorly for large relations unless the inner table has an index (Index Nested-Loop Join: $O(|R| \log |S|)$).
              </p>
            </div>

            <div className="p-3 rounded-lg border bg-[var(--surface-subtle)]" style={{ borderColor: "var(--border)" }}>
              <div className="flex items-center justify-between font-mono font-bold text-xs mb-1">
                <span className="text-emerald-400">2. In-Memory Hash Join</span>
                <span className="text-emerald-400">Complexity: O(|R| + |S|)</span>
              </div>
              <p className="opacity-80 text-xs">
                Build Phase: Hashes the smaller relation $R$ into an in-memory hash table on the join attribute. Probe Phase: Scans relation $S$, hashing its join attribute and probing the hash table for matches. Ultra-fast linear performance for equi-joins!
              </p>
            </div>

            <div className="p-3 rounded-lg border bg-[var(--surface-subtle)]" style={{ borderColor: "var(--border)" }}>
              <div className="flex items-center justify-between font-mono font-bold text-xs mb-1">
                <span className="text-amber-400">3. Sort-Merge Join (SMJ)</span>
                <span className="text-amber-400">Complexity: O(|R| log |R| + |S| log |S|)</span>
              </div>
              <p className="opacity-80 text-xs">
                Sorts both relations on the join key (typically using External Merge Sort) and then advances pointers concurrently in a single linear pass. Ideal when inputs are already indexed or sorted by an ORDER BY clause.
              </p>
            </div>
          </div>
        </section>

        {/* Section 14: DBMS Deep Dive: Storage Engine, Pages & Buffer Pool */}
        <section
          className="panel p-5 rounded-xl border space-y-3"
          style={{ background: "var(--panel)", borderColor: "var(--border)" }}
        >
          <h2 className="text-base md:text-lg font-bold flex items-center gap-2" style={{ color: "var(--foreground)" }}>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-[var(--surface-subtle)] text-[var(--accent)] border border-[var(--border)]">14</span>
            Storage Engine, Slotted Pages &amp; Buffer Pool Manager
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-lg border bg-[var(--surface-subtle)] space-y-1.5" style={{ borderColor: "var(--border)" }}>
              <h3 className="font-bold text-xs md:text-sm text-[var(--accent)]">Slotted-Page Architecture</h3>
              <p className="text-xs opacity-85 leading-relaxed">
                Relational tables are stored on disk in fixed-size blocks called <em>Pages</em> (typically 4KB or 8KB). A slotted page contains a page header, a slot array at the beginning growing downwards containing record offsets and lengths, and variable-length tuple data growing upwards from the bottom.
              </p>
            </div>
            <div className="p-3.5 rounded-lg border bg-[var(--surface-subtle)] space-y-1.5" style={{ borderColor: "var(--border)" }}>
              <h3 className="font-bold text-xs md:text-sm text-[var(--accent)]">Buffer Pool &amp; WAL Durability</h3>
              <p className="text-xs opacity-85 leading-relaxed">
                The Buffer Pool caches active disk pages in RAM frames. Replacement policies like LRU (Least Recently Used) or the Clock algorithm evict cold pages. Under Write-Ahead Logging (WAL) and ARIES protocol, dirty pages are never flushed to disk until transaction log records are safely persisted.
              </p>
            </div>
          </div>
        </section>

        {/* Section 15: DBMS Deep Dive: Relational Integrity & Normalization */}
        <section
          className="panel p-5 rounded-xl border space-y-3"
          style={{ background: "var(--panel)", borderColor: "var(--border)" }}
        >
          <h2 className="text-base md:text-lg font-bold flex items-center gap-2" style={{ color: "var(--foreground)" }}>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-[var(--surface-subtle)] text-[var(--accent)] border border-[var(--border)]">15</span>
            Integrity Constraints &amp; Normalization Theory
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs md:text-sm">
            <div className="p-3 rounded-lg border bg-[var(--surface-subtle)] space-y-1" style={{ borderColor: "var(--border)" }}>
              <h3 className="font-bold text-xs md:text-sm text-[var(--foreground)]">Relational Integrity Guarantees</h3>
              <ul className="list-disc list-inside opacity-85 space-y-1 text-xs">
                <li><strong>Domain Integrity:</strong> Attribute values must match defined data types and check constraints.</li>
                <li><strong>Entity Integrity:</strong> Primary key columns must be UNIQUE and NOT NULL.</li>
                <li><strong>Referential Integrity:</strong> Foreign key values must match a valid primary key in the referenced relation or be NULL. Actions include <code className="font-mono text-[11px]">CASCADE</code>, <code className="font-mono text-[11px]">SET NULL</code>, and <code className="font-mono text-[11px]">RESTRICT</code>.</li>
              </ul>
            </div>
            <div className="p-3 rounded-lg border bg-[var(--surface-subtle)] space-y-1" style={{ borderColor: "var(--border)" }}>
              <h3 className="font-bold text-xs md:text-sm text-[var(--foreground)]">Normalization Forms (1NF → BCNF)</h3>
              <ul className="list-disc list-inside opacity-85 space-y-1 text-xs">
                <li><strong>1NF:</strong> Eliminates repeating groups; attributes must contain atomic scalar values.</li>
                <li><strong>2NF:</strong> In 1NF and all non-key attributes are fully functionally dependent on the primary key (no partial dependency).</li>
                <li><strong>3NF:</strong> In 2NF and no non-key attribute is transitively dependent on the primary key.</li>
                <li><strong>BCNF:</strong> For every functional dependency $X \rightarrow Y$, $X$ must be a superkey.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section 16: DBMS Deep Dive: Concurrency Control & Isolation */}
        <section
          className="panel p-5 rounded-xl border space-y-3"
          style={{ background: "var(--panel)", borderColor: "var(--border)" }}
        >
          <h2 className="text-base md:text-lg font-bold flex items-center gap-2" style={{ color: "var(--foreground)" }}>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-[var(--surface-subtle)] text-[var(--accent)] border border-[var(--border)]">16</span>
            Transaction Processing &amp; ANSI Isolation Levels
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            <div className="p-2.5 rounded-lg border bg-[var(--surface-subtle)]" style={{ borderColor: "var(--border)" }}>
              <strong className="block mb-1 text-[var(--accent)]">Read Uncommitted</strong>
              <p className="opacity-75 leading-tight text-[11px]">Permits Dirty Reads, Non-Repeatable Reads, and Phantoms. Highest concurrency, lowest safety.</p>
            </div>
            <div className="p-2.5 rounded-lg border bg-[var(--surface-subtle)]" style={{ borderColor: "var(--border)" }}>
              <strong className="block mb-1 text-[var(--accent)]">Read Committed</strong>
              <p className="opacity-75 leading-tight text-[11px]">Prevents Dirty Reads. Queries see only committed data at statement invocation time.</p>
            </div>
            <div className="p-2.5 rounded-lg border bg-[var(--surface-subtle)]" style={{ borderColor: "var(--border)" }}>
              <strong className="block mb-1 text-[var(--accent)]">Repeatable Read</strong>
              <p className="opacity-75 leading-tight text-[11px]">Prevents Dirty Reads and Non-Repeatable Reads. Snapshot isolation prevents mid-transaction tuple changes.</p>
            </div>
            <div className="p-2.5 rounded-lg border bg-[var(--surface-subtle)]" style={{ borderColor: "var(--border)" }}>
              <strong className="block mb-1 text-[var(--accent)]">Serializable</strong>
              <p className="opacity-75 leading-tight text-[11px]">Guarantees strict serializable execution as if transactions executed one after another. Prevents Phantoms.</p>
            </div>
          </div>
        </section>

        {/* Section 17: Query Execution Pipeline in This Application */}
        <section
          className="panel p-5 rounded-xl border space-y-3"
          style={{ background: "var(--panel)", borderColor: "var(--border)" }}
        >
          <h2 className="text-base md:text-lg font-bold flex items-center gap-2" style={{ color: "var(--foreground)" }}>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-[var(--surface-subtle)] text-[var(--accent)] border border-[var(--border)]">17</span>
            Query Execution Pipeline in This Application
          </h2>
          <p className="text-xs md:text-sm opacity-90 leading-relaxed">
            Our educational engine visualizes every discrete physical step of execution in the Center Canvas:
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            {[
              { stage: "PARSER", desc: "Lexical & AST generation" },
              { stage: "CATALOG", desc: "Relation schema lookup" },
              { stage: "CONSTRAINT", desc: "PK/FK integrity assert" },
              { stage: "FROM", desc: "Buffer pool page scan" },
              { stage: "JOIN", desc: "Nested-loop/hash join" },
              { stage: "WHERE", desc: "Tuple filter predicate" },
              { stage: "GROUP BY", desc: "Tuple bucket partition" },
              { stage: "HAVING", desc: "Group-level predicate" },
              { stage: "AGGREGATE", desc: "COUNT, SUM, AVG scalar" },
              { stage: "SELECT", desc: "Attribute projection" },
              { stage: "DISTINCT", desc: "Deduplication" },
              { stage: "ORDER BY", desc: "External merge sort" },
              { stage: "LIMIT", desc: "Top-N cutoff" },
            ].map((p) => (
              <div
                key={p.stage}
                className="px-2.5 py-1.5 rounded-lg border text-xs flex flex-col gap-0.5 bg-[var(--surface-subtle)]"
                style={{ borderColor: "var(--border)" }}
              >
                <span className="font-mono font-bold text-[var(--accent)]">{p.stage}</span>
                <span className="opacity-70 text-[11px]">{p.desc}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Section 18: Advantages & Limitations */}
        <section
          className="panel p-5 rounded-xl border space-y-3"
          style={{ background: "var(--panel)", borderColor: "var(--border)" }}
        >
          <h2 className="text-base md:text-lg font-bold flex items-center gap-2" style={{ color: "var(--foreground)" }}>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-[var(--surface-subtle)] text-[var(--accent)] border border-[var(--border)]">18</span>
            Advantages &amp; Limitations of Modern NL→SQL
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs md:text-sm">
            <div className="p-3 rounded-lg border bg-[var(--surface-subtle)] space-y-1.5" style={{ borderColor: "var(--border)" }}>
              <h3 className="font-bold text-emerald-400">Advantages</h3>
              <ul className="list-disc list-inside opacity-85 space-y-1 text-xs">
                <li>Zero learning curve for non-technical domain specialists.</li>
                <li>Drastic productivity acceleration for drafting multi-table join syntax.</li>
                <li>Seamless multimodal integration with voice recognition speech APIs.</li>
                <li>Direct translation from colloquial human terms into verifiable mathematical relations.</li>
              </ul>
            </div>
            <div className="p-3 rounded-lg border bg-[var(--surface-subtle)] space-y-1.5" style={{ borderColor: "var(--border)" }}>
              <h3 className="font-bold text-rose-400">Limitations &amp; Challenges</h3>
              <ul className="list-disc list-inside opacity-85 space-y-1 text-xs">
                <li>Vague user phrasing (&ldquo;best items&rdquo;) requires business logic context.</li>
                <li>Complex correlated subqueries and window functions can occasionally deviate from user intent.</li>
                <li>Risk of hallucinating column names without explicit schema context.</li>
                <li>Production deployments require read-only execution sandboxes to prevent accidental data deletion.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section 19: Real-World Applications */}
        <section
          className="panel p-5 rounded-xl border space-y-2.5"
          style={{ background: "var(--panel)", borderColor: "var(--border)" }}
        >
          <h2 className="text-base md:text-lg font-bold flex items-center gap-2" style={{ color: "var(--foreground)" }}>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-[var(--surface-subtle)] text-[var(--accent)] border border-[var(--border)]">19</span>
            Real-World Applications &amp; Industry Deployments
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            <div className="p-3 rounded-lg border bg-[var(--surface-subtle)]" style={{ borderColor: "var(--border)" }}>
              <h3 className="font-semibold text-xs md:text-sm mb-1">Business Intelligence &amp; Analytics</h3>
              <p className="text-xs opacity-80 leading-relaxed">
                Integrated copilots in tools like Snowflake, BigQuery, Tableau, and PowerBI enabling natural language metric dashboards.
              </p>
            </div>
            <div className="p-3 rounded-lg border bg-[var(--surface-subtle)]" style={{ borderColor: "var(--border)" }}>
              <h3 className="font-semibold text-xs md:text-sm mb-1">Healthcare &amp; Clinical Informatics</h3>
              <p className="text-xs opacity-80 leading-relaxed">
                Allowing physicians and clinical researchers to query patient cohorts, dosage records, and lab outcomes without SQL expertise.
              </p>
            </div>
            <div className="p-3 rounded-lg border bg-[var(--surface-subtle)]" style={{ borderColor: "var(--border)" }}>
              <h3 className="font-semibold text-xs md:text-sm mb-1">E-Commerce &amp; Inventory Management</h3>
              <p className="text-xs opacity-80 leading-relaxed">
                Logistics directors querying stock anomalies, transit times, and regional sales spikes conversationally.
              </p>
            </div>
            <div className="p-3 rounded-lg border bg-[var(--surface-subtle)]" style={{ borderColor: "var(--border)" }}>
              <h3 className="font-semibold text-xs md:text-sm mb-1">Autonomous Multi-Agent Systems</h3>
              <p className="text-xs opacity-80 leading-relaxed">
                Autonomous AI agents querying internal data warehouses to compile real-time analytical reports and market predictions.
              </p>
            </div>
          </div>
        </section>

        {/* Section 20: Summary */}
        <section
          className="panel p-5 rounded-xl border space-y-2.5"
          style={{ background: "var(--panel)", borderColor: "var(--border)" }}
        >
          <h2 className="text-base md:text-lg font-bold flex items-center gap-2" style={{ color: "var(--foreground)" }}>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-[var(--surface-subtle)] text-[var(--accent)] border border-[var(--border)]">20</span>
            Summary &amp; Takeaways
          </h2>
          <p className="text-xs md:text-sm opacity-90 leading-relaxed">
            The convergence of Natural Language Processing and Relational Database Management Systems unites two foundational pillars of computer science. By translating unstructured human language into deterministic relational algebra, validating queries against schema catalogs, and optimizing them through physical execution algorithms, NL→SQL democratizes data analysis while preserving mathematical correctness and relational database guarantees.
          </p>
        </section>

        {/* ANIMATED / EDUCATIONAL VIDEO SECTION */}
        <section
          className="panel p-5 rounded-xl border space-y-4"
          style={{ background: "var(--panel)", borderColor: "var(--border)" }}
        >
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-400 border border-purple-500/30 uppercase tracking-wider">
                Multimedia Resource
              </span>
            </div>
            <h2 className="text-base md:text-xl font-bold" style={{ color: "var(--foreground)" }}>
              Animated Explanation
            </h2>
            <p className="text-xs md:text-sm opacity-80 mt-1" style={{ color: "var(--muted)" }}>
              Watch this educational breakdown on how Natural Language Processing models understand human communication and convert unstructured data into structured formats.
            </p>
          </div>

          <div className="relative w-full aspect-video rounded-xl overflow-hidden border shadow-lg bg-black/40" style={{ borderColor: "var(--border)" }}>
            <iframe
              className="w-full h-full"
              src="https://www.youtube-nocookie.com/embed/fOvTtapxa9c"
              title="What is NLP (Natural Language Processing)? - IBM Technology"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>

          <p className="text-xs opacity-75 italic" style={{ color: "var(--muted)" }}>
            Educational Video: <em>&ldquo;What is NLP (Natural Language Processing)?&rdquo;</em> by IBM Technology — detailing tokenization, semantic extraction, and AI processing used in modern language interfaces.
          </p>
        </section>

        {/* REFERENCES SECTION */}
        <section
          className="panel p-5 rounded-xl border space-y-5"
          style={{ background: "var(--panel)", borderColor: "var(--border)" }}
        >
          <div>
            <h2 className="text-base md:text-xl font-bold" style={{ color: "var(--foreground)" }}>
              References
            </h2>
            <p className="text-xs md:text-sm opacity-80 mt-1" style={{ color: "var(--muted)" }}>
              Credible academic textbooks, peer-reviewed research papers, and authoritative documentation in DBMS, NLP, and Text-to-SQL.
            </p>
          </div>

          <div className="space-y-4 text-xs md:text-sm">
            {/* Books */}
            <div>
              <h3 className="font-bold text-xs uppercase tracking-wider text-[var(--accent)] mb-2">
                1. Books
              </h3>
              <ul className="list-disc list-inside space-y-1.5 opacity-90 pl-1">
                <li>
                  Silberschatz, A., Korth, H. F., &amp; Sudarshan, S. (2020). <em>Database System Concepts</em> (7th ed.). McGraw-Hill Education.
                </li>
                <li>
                  Jurafsky, D., &amp; Martin, J. H. (2023). <em>Speech and Language Processing: An Introduction to Natural Language Processing, Computational Linguistics, and Speech Recognition</em> (3rd ed. draft). Stanford University.
                </li>
                <li>
                  Ramakrishnan, R., &amp; Gehrke, J. (2003). <em>Database Management Systems</em> (3rd ed.). McGraw-Hill Education.
                </li>
                <li>
                  Garcia-Molina, H., Ullman, J. D., &amp; Widom, J. (2008). <em>Database Systems: The Complete Book</em> (2nd ed.). Pearson Prentice Hall.
                </li>
              </ul>
            </div>

            {/* Research Papers */}
            <div className="pt-2 border-t" style={{ borderColor: "var(--border)" }}>
              <h3 className="font-bold text-xs uppercase tracking-wider text-[var(--accent)] mb-2">
                2. Research Papers
              </h3>
              <ul className="list-disc list-inside space-y-1.5 opacity-90 pl-1">
                <li>
                  Zhong, V., Xiong, C., &amp; Socher, R. (2017). <em>Seq2SQL: Generating Structured Queries from Natural Language using Reinforcement Learning</em>. arXiv:1709.00103.{" "}
                  <a
                    href="https://arxiv.org/abs/1709.00103"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[var(--accent)] hover:underline"
                  >
                    [arXiv Link]
                  </a>
                </li>
                <li>
                  Yu, T., Zhang, R., Yang, K., Yasunaga, M., Wang, D., Li, Z., Ma, J., Li, I., Yao, Q., Roman, S., Zhang, Z., &amp; Radev, D. (2018). <em>Spider: A Large-Scale Human-Labeled Dataset for Complex and Cross-Domain Semantic Parsing and Text-to-SQL Task</em>. Proceedings of EMNLP 2018.{" "}
                  <a
                    href="https://arxiv.org/abs/1809.08887"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[var(--accent)] hover:underline"
                  >
                    [arXiv Link]
                  </a>
                </li>
                <li>
                  Wang, B., Shin, R., Liu, X., Polozov, O., &amp; Richardson, M. (2020). <em>RAT-SQL: Relation-Aware Schema Encoding and Linking for Text-to-SQL Parsers</em>. Proceedings of ACL 2020.{" "}
                  <a
                    href="https://arxiv.org/abs/1911.04942"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[var(--accent)] hover:underline"
                  >
                    [arXiv Link]
                  </a>
                </li>
              </ul>
            </div>

            {/* Websites / Documentation */}
            <div className="pt-2 border-t" style={{ borderColor: "var(--border)" }}>
              <h3 className="font-bold text-xs uppercase tracking-wider text-[var(--accent)] mb-2">
                3. Websites &amp; Documentation
              </h3>
              <ul className="list-disc list-inside space-y-1.5 opacity-90 pl-1">
                <li>
                  <a
                    href="https://www.postgresql.org/docs/current/query-processing.html"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[var(--accent)] hover:underline"
                  >
                    PostgreSQL Documentation — Chapter 53: Overview of Query Processing
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.sqlite.org/arch.html"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[var(--accent)] hover:underline"
                  >
                    SQLite Architecture &amp; Virtual Database Engine (VDBE) Specification
                  </a>
                </li>
                <li>
                  <a
                    href="https://ai.google.dev/docs"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[var(--accent)] hover:underline"
                  >
                    Google Gemini API Documentation — Structured Output &amp; Reasoning
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.iso.org/standard/63555.html"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[var(--accent)] hover:underline"
                  >
                    ISO/IEC 9075:2016 Information Technology — Database Languages — SQL
                  </a>
                </li>
              </ul>
            </div>

            {/* Educational Resources */}
            <div className="pt-2 border-t" style={{ borderColor: "var(--border)" }}>
              <h3 className="font-bold text-xs uppercase tracking-wider text-[var(--accent)] mb-2">
                4. Educational Resources
              </h3>
              <ul className="list-disc list-inside space-y-1.5 opacity-90 pl-1">
                <li>
                  <a
                    href="https://15445.courses.cs.cmu.edu/"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[var(--accent)] hover:underline"
                  >
                    Carnegie Mellon University — 15-445/645: Database Systems (Prof. Andy Pavlo)
                  </a>
                </li>
                <li>
                  <a
                    href="https://cs145.stanford.edu/"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[var(--accent)] hover:underline"
                  >
                    Stanford University — CS145: Data Management and Data Systems
                  </a>
                </li>
                <li>
                  <a
                    href="https://web.stanford.edu/class/cs224n/"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[var(--accent)] hover:underline"
                  >
                    Stanford University — CS224N: Natural Language Processing with Deep Learning
                  </a>
                </li>
              </ul>
            </div>

            {/* Videos */}
            <div className="pt-2 border-t" style={{ borderColor: "var(--border)" }}>
              <h3 className="font-bold text-xs uppercase tracking-wider text-[var(--accent)] mb-2">
                5. Videos
              </h3>
              <ul className="list-disc list-inside space-y-1.5 opacity-90 pl-1">
                <li>
                  <a
                    href="https://www.youtube.com/watch?v=fOvTtapxa9c"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[var(--accent)] hover:underline"
                  >
                    IBM Technology — What is NLP (Natural Language Processing)?
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.youtube.com/c/CMUDatabaseGroup"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[var(--accent)] hover:underline"
                  >
                    Carnegie Mellon Database Group — Query Execution &amp; Relational Engine Internals
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.youtube.com/user/Computerphile"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[var(--accent)] hover:underline"
                  >
                    Computerphile — SQL, Relational Algebra, and Data Normalization
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
