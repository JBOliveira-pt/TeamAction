// Página de política de privacidade.
import Link from "next/link";
import Image from "next/image";
import { ASSETS } from "@/app/lib/assets";

export default function PrivacidadePage() {
    return (
        <div className="min-h-screen bg-slate-50 text-slate-800">
            {/* Header */}
            <header className="border-b border-slate-200 bg-white">
                <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-5">
                    <Link
                        href="/"
                        className="transition-opacity hover:opacity-80"
                    >
                        <Image
                            src={ASSETS.logoFullWhite}
                            alt="TeamAction"
                            width={160}
                            height={40}
                            className="h-auto w-auto max-w-[160px]"
                        />
                    </Link>
                    <Link
                        href="/"
                        className="text-sm font-medium text-slate-600 transition hover:text-slate-900"
                    >
                        ← Voltar ao início
                    </Link>
                </div>
            </header>

            {/* Content */}
            <main className="mx-auto max-w-4xl px-4 py-16">
                <h1 className="text-3xl font-bold text-slate-900">
                    Política de Privacidade
                </h1>
                <p className="mt-2 text-sm text-slate-500">
                    Última atualização: 12 de abril de 2026
                </p>

                <div className="mt-10 space-y-8 text-sm leading-relaxed text-slate-700">
                    {/* 1 — Responsável pelo Tratamento */}
                    <section>
                        <h2 className="mb-3 text-lg font-semibold text-slate-900">
                            1. Responsável pelo Tratamento de Dados
                        </h2>
                        <p>
                            O responsável pelo tratamento dos dados pessoais
                            recolhidos através da plataforma{" "}
                            <strong>TeamAction</strong> (&quot;nós&quot;,
                            &quot;nosso&quot; ou &quot;plataforma&quot;) é a
                            entidade que opera o serviço, com sede em Lisboa,
                            Portugal. Para qualquer questão relativa à proteção
                            de dados, pode contactar-nos através do e-mail{" "}
                            <a
                                href="mailto:teamaction@outlook.pt"
                                className="font-medium text-blue-600 underline transition hover:text-blue-800"
                            >
                                teamaction@outlook.pt
                            </a>
                            .
                        </p>
                    </section>

                    {/* 2 — Dados que Recolhemos */}
                    <section>
                        <h2 className="mb-3 text-lg font-semibold text-slate-900">
                            2. Dados que Recolhemos
                        </h2>
                        <p className="mb-2">
                            Podemos recolher os seguintes tipos de informação:
                        </p>
                        <ul className="list-disc space-y-1.5 pl-5">
                            <li>
                                <strong>Dados de identificação:</strong> nome,
                                apelido, e-mail, data de nascimento, NIF,
                                morada, telemóvel.
                            </li>
                            <li>
                                <strong>Dados de conta:</strong> tipo de conta
                                (presidente, treinador, atleta, responsável),
                                fotografia de perfil, organização associada.
                            </li>
                            <li>
                                <strong>Dados desportivos:</strong> peso,
                                altura, avaliações físicas, planos de nutrição,
                                assiduidade a treinos e jogos.
                            </li>
                            <li>
                                <strong>Dados de utilização:</strong> logs de
                                acesso, ações realizadas na plataforma,
                                preferências de tema, endereço IP e tipo de
                                navegador.
                            </li>
                            <li>
                                <strong>Dados de newsletter:</strong> nome e
                                e-mail fornecidos voluntariamente para
                                subscrição.
                            </li>
                        </ul>
                    </section>

                    {/* 3 — Base Legal */}
                    <section>
                        <h2 className="mb-3 text-lg font-semibold text-slate-900">
                            3. Base Legal para o Tratamento
                        </h2>
                        <p className="mb-2">
                            Nos termos do artigo 6.º do RGPD (Regulamento (UE)
                            2016/679), tratamos os seus dados com base nas
                            seguintes fundamentações legais:
                        </p>
                        <ul className="list-disc space-y-1.5 pl-5">
                            <li>
                                <strong>
                                    Execução de contrato (Art. 6.º, n.º 1, al.
                                    b):
                                </strong>{" "}
                                tratamento necessário para a criação da conta,
                                prestação do serviço e funcionalidades da
                                plataforma.
                            </li>
                            <li>
                                <strong>
                                    Consentimento (Art. 6.º, n.º 1, al. a):
                                </strong>{" "}
                                subscrição voluntária da newsletter e
                                comunicações de marketing. Pode retirar o
                                consentimento a qualquer momento.
                            </li>
                            <li>
                                <strong>
                                    Interesse legítimo (Art. 6.º, n.º 1, al. f):
                                </strong>{" "}
                                melhoria da plataforma, segurança, prevenção de
                                fraude e análise estatística agregada.
                            </li>
                            <li>
                                <strong>
                                    Obrigação legal (Art. 6.º, n.º 1, al. c):
                                </strong>{" "}
                                cumprimento de obrigações fiscais ou legais
                                aplicáveis.
                            </li>
                        </ul>
                    </section>

                    {/* 4 — Finalidade */}
                    <section>
                        <h2 className="mb-3 text-lg font-semibold text-slate-900">
                            4. Finalidade do Tratamento
                        </h2>
                        <ul className="list-disc space-y-1.5 pl-5">
                            <li>
                                Criação e gestão da sua conta na plataforma.
                            </li>
                            <li>
                                Funcionamento das funcionalidades de gestão
                                desportiva (equipas, treinos, jogos, atletas).
                            </li>
                            <li>
                                Comunicações relacionadas com convites, avisos e
                                notificações da plataforma.
                            </li>
                            <li>
                                Envio de newsletters quando subscrito
                                voluntariamente.
                            </li>
                            <li>
                                Melhoria contínua da plataforma e análise
                                estatística agregada.
                            </li>
                            <li>
                                Garantia da segurança e integridade da
                                plataforma.
                            </li>
                        </ul>
                    </section>

                    {/* 5 — Dados de Menores */}
                    <section>
                        <h2 className="mb-3 text-lg font-semibold text-slate-900">
                            5. Proteção de Dados de Menores
                        </h2>
                        <p>
                            Nos termos do artigo 8.º do RGPD e da Lei n.º
                            58/2019 (lei de execução portuguesa), o tratamento
                            de dados de menores de 13 anos só é lícito mediante
                            consentimento do responsável parental. Na
                            TeamAction, atletas menores de 18 anos devem ter
                            obrigatoriamente um Responsável vinculado à sua
                            conta, que supervisionará o acesso e utilização da
                            plataforma.
                        </p>
                    </section>

                    {/* 6 — Partilha e Subcontratantes */}
                    <section>
                        <h2 className="mb-3 text-lg font-semibold text-slate-900">
                            6. Partilha de Dados e Subcontratantes
                        </h2>
                        <p>
                            Não vendemos, alugamos ou partilhamos os seus dados
                            pessoais com terceiros para fins comerciais.
                            Utilizamos subcontratantes (Art. 28.º RGPD)
                            estritamente necessários ao funcionamento da
                            plataforma, com os quais mantemos acordos de
                            tratamento de dados:
                        </p>
                        <ul className="mt-2 list-disc space-y-1.5 pl-5">
                            <li>
                                <strong>Clerk</strong> (EUA) — autenticação e
                                gestão de sessões.
                            </li>
                            <li>
                                <strong>Neon / PostgreSQL</strong> (EUA) —
                                armazenamento de dados.
                            </li>
                            <li>
                                <strong>Cloudflare R2</strong> (global) —
                                armazenamento de ficheiros e imagens.
                            </li>
                            <li>
                                <strong>Resend</strong> (EUA) — envio de e-mails
                                transacionais.
                            </li>
                            <li>
                                <strong>Vercel</strong> (EUA/global) —
                                hospedagem da plataforma.
                            </li>
                        </ul>
                    </section>

                    {/* 7 — Transferências Internacionais */}
                    <section>
                        <h2 className="mb-3 text-lg font-semibold text-slate-900">
                            7. Transferências Internacionais de Dados
                        </h2>
                        <p>
                            Alguns dos subcontratantes mencionados têm sede fora
                            do Espaço Económico Europeu (EEE), nomeadamente nos
                            Estados Unidos. Estas transferências são realizadas
                            em conformidade com o Capítulo V do RGPD (Arts.
                            44.º–49.º), com base no EU-U.S. Data Privacy
                            Framework (Decisão de Adequação da Comissão Europeia
                            de julho de 2023) ou, quando aplicável, nas
                            Cláusulas Contratuais-Tipo (CCT) aprovadas pela
                            Comissão Europeia.
                        </p>
                    </section>

                    {/* 8 — Segurança */}
                    <section>
                        <h2 className="mb-3 text-lg font-semibold text-slate-900">
                            8. Segurança dos Dados
                        </h2>
                        <p>
                            Implementamos medidas técnicas e organizativas
                            adequadas (Art. 32.º RGPD) para proteger os seus
                            dados, incluindo: encriptação em trânsito
                            (HTTPS/TLS), hashing de credenciais (bcrypt),
                            controlo de acesso baseado em perfis, monitorização
                            de ações através de logs e verificação de
                            comprometimento de palavras-passe.
                        </p>
                    </section>

                    {/* 9 — Retenção */}
                    <section>
                        <h2 className="mb-3 text-lg font-semibold text-slate-900">
                            9. Retenção de Dados
                        </h2>
                        <p>
                            Os seus dados pessoais são conservados durante o
                            período estritamente necessário para cumprir as
                            finalidades descritas ou enquanto a sua conta
                            estiver ativa. Após eliminação da conta, os dados
                            serão apagados ou anonimizados num prazo máximo de
                            30 dias, salvo obrigação legal de conservação (ex.:
                            dados fiscais). Dados de newsletter são conservados
                            até cancelamento da subscrição.
                        </p>
                    </section>

                    {/* 10 — Direitos do Titular */}
                    <section>
                        <h2 className="mb-3 text-lg font-semibold text-slate-900">
                            10. Os Seus Direitos
                        </h2>
                        <p className="mb-2">
                            Nos termos dos artigos 15.º a 22.º do RGPD, tem
                            direito a:
                        </p>
                        <ul className="list-disc space-y-1.5 pl-5">
                            <li>
                                <strong>Acesso</strong> (Art. 15.º) — obter
                                confirmação e cópia dos seus dados pessoais.
                            </li>
                            <li>
                                <strong>Retificação</strong> (Art. 16.º) —
                                corrigir dados inexatos ou incompletos.
                            </li>
                            <li>
                                <strong>Apagamento</strong> (Art. 17.º) —
                                solicitar a eliminação dos seus dados
                                (&quot;direito ao esquecimento&quot;).
                            </li>
                            <li>
                                <strong>Limitação</strong> (Art. 18.º) —
                                solicitar a restrição do tratamento.
                            </li>
                            <li>
                                <strong>Portabilidade</strong> (Art. 20.º) —
                                receber os seus dados num formato estruturado e
                                de leitura automática.
                            </li>
                            <li>
                                <strong>Oposição</strong> (Art. 21.º) — opor-se
                                ao tratamento baseado em interesse legítimo.
                            </li>
                            <li>
                                <strong>Retirada de consentimento</strong> — a
                                qualquer momento, sem afetar a licitude do
                                tratamento anterior.
                            </li>
                        </ul>
                        <p className="mt-3">
                            Para exercer qualquer destes direitos, contacte-nos
                            através de{" "}
                            <a
                                href="mailto:teamaction@outlook.pt"
                                className="font-medium text-blue-600 underline transition hover:text-blue-800"
                            >
                                teamaction@outlook.pt
                            </a>
                            . Responderemos no prazo de 30 dias, nos termos do
                            Art. 12.º, n.º 3 do RGPD.
                        </p>
                    </section>

                    {/* 11 — Decisões Automatizadas */}
                    <section>
                        <h2 className="mb-3 text-lg font-semibold text-slate-900">
                            11. Decisões Automatizadas e Definição de Perfis
                        </h2>
                        <p>
                            A TeamAction não realiza decisões exclusivamente
                            automatizadas que produzam efeitos jurídicos ou
                            afetem significativamente os titulares dos dados,
                            nos termos do artigo 22.º do RGPD. Não são
                            utilizados sistemas de definição de perfis
                            (profiling) para fins de marketing ou avaliação
                            automatizada.
                        </p>
                    </section>

                    {/* 12 — Cookies e ePrivacy */}
                    <section>
                        <h2 className="mb-3 text-lg font-semibold text-slate-900">
                            12. Cookies e Tecnologias Semelhantes
                        </h2>
                        <p className="mb-2">
                            Em conformidade com a Diretiva ePrivacy (Diretiva
                            2002/58/CE, alterada pela Diretiva 2009/136/CE) e a
                            Lei n.º 41/2004 (transposta para a legislação
                            portuguesa):
                        </p>
                        <ul className="list-disc space-y-1.5 pl-5">
                            <li>
                                Utilizamos{" "}
                                <strong>
                                    apenas cookies estritamente necessários
                                </strong>{" "}
                                para o funcionamento da plataforma: autenticação
                                de sessão (Clerk) e preferência de tema
                                (claro/escuro).
                            </li>
                            <li>
                                Não utilizamos cookies de rastreamento,
                                publicidade, analítica de terceiros ou
                                tecnologias de fingerprinting.
                            </li>
                            <li>
                                Cookies estritamente necessários estão isentos
                                de consentimento nos termos do Art. 5.º, n.º 3
                                da Diretiva ePrivacy.
                            </li>
                        </ul>
                    </section>

                    {/* 13 — Violação de Dados */}
                    <section>
                        <h2 className="mb-3 text-lg font-semibold text-slate-900">
                            13. Notificação de Violação de Dados
                        </h2>
                        <p>
                            Em caso de violação de dados pessoais que represente
                            risco para os direitos e liberdades dos titulares,
                            notificaremos a autoridade de controlo competente
                            (CNPD) no prazo de 72 horas, nos termos do artigo
                            33.º do RGPD. Caso a violação seja suscetível de
                            resultar num elevado risco, os titulares afetados
                            serão igualmente notificados sem demora
                            injustificada (Art. 34.º RGPD).
                        </p>
                    </section>

                    {/* 14 — Reclamação */}
                    <section>
                        <h2 className="mb-3 text-lg font-semibold text-slate-900">
                            14. Direito de Reclamação
                        </h2>
                        <p>
                            Sem prejuízo de qualquer outra via de recurso, tem o
                            direito de apresentar reclamação junto da autoridade
                            de controlo competente (Art. 77.º RGPD). Em
                            Portugal, a autoridade de controlo é a{" "}
                            <strong>
                                Comissão Nacional de Proteção de Dados (CNPD)
                            </strong>
                            :
                        </p>
                        <ul className="mt-2 list-disc space-y-1.5 pl-5">
                            <li>
                                Website:{" "}
                                <a
                                    href="https://www.cnpd.pt"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-medium text-blue-600 underline transition hover:text-blue-800"
                                >
                                    www.cnpd.pt
                                </a>
                            </li>
                            <li>
                                E-mail:{" "}
                                <a
                                    href="mailto:geral@cnpd.pt"
                                    className="font-medium text-blue-600 underline transition hover:text-blue-800"
                                >
                                    geral@cnpd.pt
                                </a>
                            </li>
                        </ul>
                    </section>

                    {/* 15 — Alterações */}
                    <section>
                        <h2 className="mb-3 text-lg font-semibold text-slate-900">
                            15. Alterações a esta Política
                        </h2>
                        <p>
                            Podemos atualizar esta Política de Privacidade
                            periodicamente. Quaisquer alterações substanciais
                            serão comunicadas através da plataforma ou por
                            e-mail. A data de última atualização será sempre
                            indicada no topo desta página.
                        </p>
                    </section>

                    {/* 16 — Contacto */}
                    <section>
                        <h2 className="mb-3 text-lg font-semibold text-slate-900">
                            16. Contacto
                        </h2>
                        <p>
                            Para questões relacionadas com privacidade, proteção
                            de dados ou exercício dos seus direitos,
                            contacte-nos através de{" "}
                            <a
                                href="mailto:teamaction@outlook.pt"
                                className="font-medium text-blue-600 underline transition hover:text-blue-800"
                            >
                                teamaction@outlook.pt
                            </a>
                            .
                        </p>
                    </section>
                </div>
            </main>

            {/* Mini footer */}
            <footer className="border-t border-slate-200 bg-white">
                <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-6">
                    <p className="text-xs text-slate-400">
                        © {new Date().getFullYear()} TeamAction
                    </p>
                    <Link
                        href="/termos"
                        className="text-xs text-slate-500 transition hover:text-slate-700"
                    >
                        Termos de Uso
                    </Link>
                </div>
            </footer>
        </div>
    );
}
