# TeamAction

Plataforma de gestão de equipas desportivas que liga presidentes, treinadores, atletas e responsáveis (encarregados de educação) num único sistema centralizado.

O foco está na organização de treinos e jogos, acompanhamento de desempenho, estatísticas em tempo real e comunicação entre todos os intervenientes do clube.

---

## Funcionalidades

- **Gestão de clubes e equipas** — criação de clube, épocas, escalões e equipas
- **Jogos e convocatórias** — agendamento, registo de resultados e seleção de convocados
- **Estatísticas ao vivo** — golos, assistências, cartões e substituições em tempo real
- **Treinos e sessões** — planeamento, assiduidade e exercícios
- **Condição física** — avaliações físicas e planos de nutrição
- **Quadro tático** — formações e jogadas táticas
- **Calendário e notas** — visão mensal com notas por data
- **Mensalidades e recibos** — registo de pagamentos e geração de PDF
- **Convites** — sistema de convites para clubes, equipas e responsáveis
- **Comunicados e notificações** — avisos internos e alertas em tempo real
- **Relatórios** — assiduidade, atletas, staff e mensalidades
- **Painel de administração** — gestão de utilizadores, planos, logs e newsletter
- **Tema claro/escuro** e favicon dinâmico

---

## Tipos de conta

| Papel           | Descrição                                                                  |
| --------------- | -------------------------------------------------------------------------- |
| **Presidente**  | Gere o clube, equipas, staff, atletas, mensalidades e relatórios           |
| **Treinador**   | Gere sessões, jogos, exercícios, nutrição, assiduidade e quadro tático     |
| **Atleta**      | Consulta perfil, jogos, condição física, comunicados e notas médicas       |
| **Responsável** | Acompanha o educando — jogos, condição física, autorizações e mensalidades |

Existe ainda um painel **Admin** separado para gestão da plataforma.

---

## Stack tecnológica

| Camada        | Tecnologia                                                |
| ------------- | --------------------------------------------------------- |
| Framework     | [Next.js 16](https://nextjs.org/) (App Router, Turbopack) |
| Linguagem     | TypeScript                                                |
| UI            | React 19, Tailwind CSS 4, Lucide Icons, Heroicons         |
| Autenticação  | [Clerk](https://clerk.com/)                               |
| Base de dados | PostgreSQL ([Neon](https://neon.tech/))                   |
| Armazenamento | [Cloudflare R2](https://www.cloudflare.com/r2/)           |
| E-mail        | Nodemailer / Resend                                       |
| PDF           | @react-pdf/renderer, PDFKit                               |
| Gráficos      | Recharts                                                  |
| Animações     | GSAP                                                      |
| Validação     | Zod                                                       |
| Webhooks      | Svix (Clerk)                                              |
| Deploy        | [Vercel](https://vercel.com/)                             |

---

## Estrutura do projeto

```
app/
├── api/                  # ~33 endpoints REST (jogos, atletas, convites, etc.)
├── admin/                # Painel de administração
├── admin-login/          # Login do admin
├── components/           # Componentes partilhados (header, footer, navbar…)
├── dashboard/
│   ├── (overview)/       # Página inicial do dashboard
│   ├── presidente/       # Secções do presidente
│   ├── treinador/        # Secções do treinador
│   ├── atleta/           # Secções do atleta
│   ├── responsavel/      # Secções do responsável
│   ├── definicoes/       # Definições da conta
│   └── utilizador/       # Perfil do utilizador
├── lib/
│   ├── actions/          # Server actions (jogos, atletas, equipas…)
│   └── data/             # Funções de fetch de dados
├── login/                # Página de login
├── signup/               # Registo e verificação
└── ui/                   # Componentes de UI reutilizáveis
public/                   # Assets estáticos
```

---

## Modalidades

A arquitetura suporta múltiplas modalidades desportivas (18 previstas). Atualmente, apenas **Andebol** está ativa.

---

## Instalação

```bash
git clone https://github.com/JBOliveira-pt/TeamAction.git
cd TeamAction
pnpm install
```

Criar um ficheiro `.env.local` com as variáveis necessárias (Clerk, Neon, R2, Resend, etc.).

```bash
pnpm dev
```

Abrir [http://localhost:3000](http://localhost:3000).

---

## Scripts

| Comando           | Descrição                             |
| ----------------- | ------------------------------------- |
| `pnpm dev`        | Servidor de desenvolvimento (webpack) |
| `pnpm build`      | Build de produção (Turbopack)         |
| `pnpm start`      | Servidor de produção                  |
| `pnpm lint`       | Linting com ESLint                    |
| `pnpm db:migrate` | Migrações da base de dados            |

---

## 📄 License

This project is currently under development.
TeamAction – Empowering Sports Management.
