import React from "react";
import { Button } from "../../components/ui/button";

export const Desktop = (): JSX.Element => {
  const navigationItems = [
    { text: "SICOES", href: "#sicoes" },
    { text: "Planes", href: "#planes" },
    { text: "Contactar", href: "#contactar" },
  ];

  const footerNavigationItems = [
    { text: "SICOES" },
    { text: "Planes" },
    { text: "Contactar" },
    { text: "Iniciar sesión" },
    { text: "Suscribirme" },
    { text: "Solicitar demo" },
  ];

  return (
    <div
      className="bg-[#f9f9f9] grid justify-items-center [align-items:start] w-screen"
      data-model-id="2:2"
    >
      <div className="bg-[#f9f9f9] w-full max-w-[1440px] min-h-[3174.5px] relative">
        {/* Header Navigation */}
        <header className="flex items-center justify-between w-full px-8 py-8 translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:0ms]">
          <div className="flex items-center">
            <img
              className="w-20 h-20 object-cover"
              alt="Copilot"
              src="https://c.animaapp.com/mem3zc1bic5PtM/img/copilot-20250807-171927-2.png"
            />
            <div className="w-[189px] h-[46px] [font-family:'IBM_Plex_Mono',Helvetica] font-semibold text-[#1b263b] text-[35px] tracking-[-0.70px] leading-[normal]">
              SICOEsCAN
            </div>
          </div>

          <nav className="flex items-center gap-8">
            {navigationItems.map((item, index) => (
              <Button
                key={item.text}
                variant="ghost"
                className="h-auto p-2.5 shadow-[0px_4px_4px_#00000040] [font-family:'Inter',Helvetica] font-semibold text-[#1b263b] text-[35px] tracking-[-1.05px] hover:bg-gray-100 transition-colors"
              >
                {item.text}
              </Button>
            ))}

            <Button className="h-auto p-2.5 bg-[#1d7874] rounded-2xl shadow-[0px_4px_4px_#00000040] [text-shadow:0px_4px_4px_#00000040] [font-family:'Inter',Helvetica] font-semibold text-[#efefef] text-[35px] tracking-[-1.05px] hover:bg-[#1d7874]/90 transition-colors">
              Iniciar sesión
            </Button>

            <Button className="h-auto p-2.5 bg-[#1d7874] rounded-2xl shadow-[0px_4px_4px_#00000040] [text-shadow:0px_4px_4px_#00000040] [font-family:'Inter',Helvetica] font-semibold text-[#efefef] text-[35px] tracking-[-1.05px] hover:bg-[#1d7874]/90 transition-colors">
              Suscribirme
            </Button>
          </nav>
        </header>

        {/* Hero Section */}
        <section className="flex items-start justify-between px-8 mt-16">
          <div className="translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:200ms]">
            <img
              className="w-[512px] h-[512px] object-cover"
              alt="Chatgpt image ago"
              src="https://c.animaapp.com/mem3zc1bic5PtM/img/chatgpt-image-7-ago-2025--05-41-35-p-m--1.png"
            />
          </div>

          <div className="flex-1 ml-12 translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:400ms]">
            <h1 className="[text-shadow:0px_4px_4px_#00000040] [-webkit-text-stroke:1px_#1b263b] [font-family:'Caveat',Helvetica] font-normal text-[#1b263b] text-[69px] tracking-[-2.07px] leading-[normal] underline mb-8">
              ¡Haz que el estado sea tu mejor cliente!
            </h1>

            <p className="w-[713px] [font-family:'Caveat',Helvetica] font-bold text-black text-[42px] tracking-[-1.26px] leading-[normal] mb-12">
              Cada día, se publican cientos de procesos en SICOES. ¿Cuántas
              oportunidades estás dejando pasar? Con SICOEsCAN, encuentra y
              gestiona fácilmente los procesos que mejor se adaptan a tu
              empresa.
            </p>

            <div className="flex items-center gap-4 translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:600ms]">
              <Button className="h-auto p-2.5 bg-[#1b263b] rounded-2xl [font-family:'Inter',Helvetica] font-semibold text-[#efefef] text-[35px] tracking-[-1.05px] hover:bg-[#1b263b]/90 transition-colors">
                Ver video
              </Button>

              <img
                className="w-12 h-12"
                alt="Mouse pointer"
                src="https://c.animaapp.com/mem3zc1bic5PtM/img/mouse-pointer.svg"
              />
            </div>
          </div>
        </section>

        {/* Notifications Section */}
        <section className="w-full bg-[#1b263b] mt-32 py-24 translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:800ms]">
          <div className="max-w-[1440px] mx-auto px-8 flex items-start justify-between">
            <div className="flex-1 max-w-[620px]">
              <h2 className="[font-family:'Inter',Helvetica] font-semibold text-[#f9f9f9] text-[52px] text-right tracking-[-1.56px] leading-[normal] mb-8">
                Recibe notificaciones diarias personalizadas de nuevos procesos
              </h2>

              <img
                className="w-full h-1.5 mb-8"
                alt="Line"
                src="https://c.animaapp.com/mem3zc1bic5PtM/img/line-3.svg"
              />

              <h3 className="[font-family:'Inter',Helvetica] font-semibold text-[#f9f9f9] text-[37px] tracking-[-1.11px] leading-[normal] mb-4">
                ¿Sigues revisando manualmente las nuevas publicaciones en
                SICOES?
              </h3>

              <p className="[font-family:'Inter',Helvetica] font-light text-[#f9f9f9] text-3xl tracking-[-0.90px] leading-[normal] mb-8">
                Indícanos qué ítems vendes al Estado o cuáles son de tu interés,
                y te notificaremos cada vez que se publique uno nuevo en SICOES.
              </p>

              <img
                className="w-full h-1.5 mb-8"
                alt="Line"
                src="https://c.animaapp.com/mem3zc1bic5PtM/img/line-3.svg"
              />

              <h3 className="[font-family:'Inter',Helvetica] font-semibold text-[#f9f9f9] text-[37px] tracking-[-1.11px] leading-[normal] mb-4">
                ¿Te preocupa perder oportunidades clave por no enterarte a
                tiempo?
              </h3>

              <p className="[font-family:'Inter',Helvetica] font-light text-[#f9f9f9] text-3xl tracking-[-0.90px] leading-[normal] mb-12">
                Evita que se te pase de largo ese proceso que podría marcar la
                diferencia en tu empresa.
              </p>

              <div className="flex items-center gap-4">
                <img
                  className="w-20 h-20"
                  alt="Arrow forward"
                  src="https://c.animaapp.com/mem3zc1bic5PtM/img/arrow-forward.svg"
                />

                <Button className="flex items-center gap-1.5 h-auto bg-[#f9f9f9] rounded-[20px] p-0 hover:bg-[#f9f9f9]/90 transition-colors">
                  <img
                    className="w-20 h-20 rounded-[20px] object-cover"
                    alt="Copilot"
                    src="https://c.animaapp.com/mem3zc1bic5PtM/img/copilot-20250807-171927-2.png"
                  />

                  <div className="px-4 [font-family:'Inter',Helvetica] font-semibold text-[#1d7874] text-[35px] tracking-[-1.05px] leading-[normal] whitespace-nowrap">
                    Solicitar demo
                  </div>

                  <img
                    className="w-[3px] h-20"
                    alt="Line"
                    src="https://c.animaapp.com/mem3zc1bic5PtM/img/line-5.svg"
                  />
                </Button>

                <img
                  className="w-20 h-20"
                  alt="Arrow forward"
                  src="https://c.animaapp.com/mem3zc1bic5PtM/img/arrow-forward-1.svg"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Database Access Section */}
        <section className="px-8 py-24 translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:1000ms]">
          <div className="max-w-[620px]">
            <h2 className="[font-family:'Inter',Helvetica] font-semibold text-[#1b263b] text-[52px] tracking-[-1.56px] leading-[normal] mb-8">
              Ten acceso a una base de datos completa del SICOES
            </h2>

            <img
              className="w-full h-1.5 mb-8"
              alt="Line"
              src="https://c.animaapp.com/mem3zc1bic5PtM/img/line-3.svg"
            />

            <h3 className="[font-family:'Inter',Helvetica] font-semibold text-[#1b263b] text-[37px] tracking-[-1.11px] leading-[normal] mb-4">
              ¡Conoce a tu competencia!
            </h3>

            <p className="[font-family:'Inter',Helvetica] font-light text-[#1b263b] text-3xl tracking-[-0.90px] leading-[normal] mb-8">
              Analiza quiénes participan, quienes ganan y a que precios. Toma la
              ventaja conociendo información clave del mercado.
            </p>

            <h3 className="[font-family:'Inter',Helvetica] font-semibold text-[#1b263b] text-[37px] tracking-[-1.11px] leading-[normal] mb-4">
              ¡Detecta los procesos e ítems que nadie aprovechó!
            </h3>

            <p className="[font-family:'Inter',Helvetica] font-light text-[#1b263b] text-3xl tracking-[-0.90px] leading-[normal] mb-12">
              Explora fácilmente los ítems declarados desiertos en SICOES.
              Encuentra oportunidades reales donde no hubo oferentes y prepárate
              para ser el primero en presentarte en la próxima convocatoria.
            </p>

            <div className="flex items-center gap-4">
              <img
                className="w-20 h-20"
                alt="Arrow forward"
                src="https://c.animaapp.com/mem3zc1bic5PtM/img/arrow-forward.svg"
              />

              <Button className="flex items-center gap-1.5 h-auto bg-[#1b263b] rounded-[20px] p-0 hover:bg-[#1b263b]/90 transition-colors">
                <img
                  className="w-20 h-20 rounded-[20px] object-cover"
                  alt="Copilot"
                  src="https://c.animaapp.com/mem3zc1bic5PtM/img/copilot-20250809-202855-3-2.png"
                />

                <div className="px-4 [font-family:'Inter',Helvetica] font-semibold text-[#1d7874] text-[35px] tracking-[-1.05px] leading-[normal] whitespace-nowrap">
                  Solicitar demo
                </div>

                <img
                  className="w-[3px] h-20"
                  alt="Line"
                  src="https://c.animaapp.com/mem3zc1bic5PtM/img/line-5.svg"
                />
              </Button>

              <img
                className="w-20 h-20"
                alt="Arrow forward"
                src="https://c.animaapp.com/mem3zc1bic5PtM/img/arrow-forward-1.svg"
              />
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="w-full bg-[#1b263b] py-16 translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:1200ms]">
          <div className="max-w-[1440px] mx-auto px-8 grid grid-cols-4 gap-8">
            <div className="flex flex-col">
              <Button className="flex items-center gap-1.5 h-auto bg-[#1b263b] rounded-[20px] p-0 mb-8 hover:bg-[#1b263b]/90 transition-colors">
                <img
                  className="w-20 h-20 rounded-[20px] object-cover"
                  alt="Copilot"
                  src="https://c.animaapp.com/mem3zc1bic5PtM/img/copilot-20250809-202855-3-2.png"
                />

                <div className="px-4 [font-family:'Inter',Helvetica] font-semibold text-[#f9f9f9] text-[35px] tracking-[-1.05px] leading-[normal] whitespace-nowrap">
                  Solicitar demo
                </div>

                <img
                  className="w-[3px] h-20"
                  alt="Line"
                  src="https://c.animaapp.com/mem3zc1bic5PtM/img/line-5.svg"
                />
              </Button>

              <nav className="flex flex-col gap-2">
                {footerNavigationItems.map((item, index) => (
                  <Button
                    key={`${item.text}-${index}`}
                    variant="ghost"
                    className="h-auto p-2.5 justify-start [font-family:'Inter',Helvetica] font-light text-[#f9f9f9] text-[25px] tracking-[-0.75px] hover:bg-gray-800 transition-colors"
                  >
                    {item.text}
                  </Button>
                ))}
              </nav>
            </div>

            <div className="col-span-2">
              <h3 className="[font-family:'Inter',Helvetica] font-medium text-[#f9f9f9] text-[35px] tracking-[-1.05px] leading-[normal] mb-4">
                Contacto
              </h3>
              <p className="[font-family:'Inter',Helvetica] font-light text-white text-[25px] tracking-[-0.75px] leading-[normal]">
                ventas@sicoescan.com
              </p>
            </div>

            <div>
              <h3 className="[font-family:'Inter',Helvetica] font-medium text-[#f9f9f9] text-[35px] tracking-[-1.05px] leading-[normal]">
                Síguenos
              </h3>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};
