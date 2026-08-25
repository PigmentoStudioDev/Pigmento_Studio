"use client";

// Galeria de componentes de Carbon. No pretende ser exhaustiva (263 exports):
// cubre un representante de cada familia para poder juzgar el tema de un vistazo.

import { useState } from "react";
import {
  Accordion,
  AccordionItem,
  Breadcrumb,
  BreadcrumbItem,
  Button,
  ButtonSet,
  Checkbox,
  ClickableTile,
  CodeSnippet,
  ComboBox,
  ContentSwitcher,
  DatePicker,
  DatePickerInput,
  Dropdown,
  FileUploader,
  InlineLoading,
  InlineNotification,
  Link,
  Loading,
  Modal,
  MultiSelect,
  NumberInput,
  Pagination,
  ProgressBar,
  ProgressIndicator,
  ProgressStep,
  RadioButton,
  RadioButtonGroup,
  Search,
  Select,
  SelectItem,
  SkeletonText,
  Slider,
  Switch,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  Tag,
  TextArea,
  TextInput,
  Tile,
  Toggle,
} from "@carbon/react";

const FRUITS = [
  { id: "uno", text: "Opcion uno" },
  { id: "dos", text: "Opcion dos" },
  { id: "tres", text: "Opcion tres" },
];

const ROWS = [
  { id: "a", nombre: "Pigmento", rol: "Estudio", estado: "Activo" },
  { id: "b", nombre: "Carbon", rol: "Design system", estado: "v11" },
  { id: "c", nombre: "Next", rol: "Framework", estado: "16.3" },
];

function Block({
  title,
  children,
}: {
  readonly title: string;
  readonly children: React.ReactNode;
}) {
  return (
    <section className="pg-block">
      <h3 className="pg-type--heading-02 pg-group-title">{title}</h3>
      {children}
    </section>
  );
}

export function ComponentGallery() {
  const [modalOpen, setModalOpen] = useState(false);
  const [page, setPage] = useState(1);

  return (
    <div className="pg-stack">
      <Block title="Acciones">
        <div className="pg-row">
          <Button kind="primary">Primary</Button>
          <Button kind="secondary">Secondary</Button>
          <Button kind="tertiary">Tertiary</Button>
          <Button kind="ghost">Ghost</Button>
          <Button kind="danger">Danger</Button>
          <Button disabled>Disabled</Button>
        </div>
        <div className="pg-row">
          <Button size="sm">sm</Button>
          <Button size="md">md</Button>
          <Button size="lg">lg</Button>
          <Button size="xl">xl</Button>
        </div>
        <ButtonSet>
          <Button kind="secondary">Cancelar</Button>
          <Button kind="primary">Guardar</Button>
        </ButtonSet>
      </Block>

      <Block title="Formularios">
        <div className="pg-grid">
          <TextInput id="pg-text" labelText="Texto" placeholder="Escribe algo" />
          <TextInput
            id="pg-text-invalid"
            labelText="Con error"
            invalid
            invalidText="Este campo es obligatorio"
          />
          <NumberInput id="pg-number" label="Numero" min={0} max={10} value={4} />
          <Select id="pg-select" labelText="Select">
            <SelectItem value="1" text="Uno" />
            <SelectItem value="2" text="Dos" />
          </Select>
          <Dropdown
            id="pg-dropdown"
            titleText="Dropdown"
            label="Elige una opcion"
            items={FRUITS}
            itemToString={(item) => item?.text ?? ""}
          />
          <ComboBox
            id="pg-combo"
            titleText="ComboBox"
            placeholder="Busca y elige"
            items={FRUITS}
            itemToString={(item) => item?.text ?? ""}
            onChange={() => undefined}
          />
          <MultiSelect
            id="pg-multi"
            titleText="MultiSelect"
            label="Varias opciones"
            items={FRUITS}
            itemToString={(item) => item?.text ?? ""}
          />
          <DatePicker datePickerType="single">
            <DatePickerInput
              id="pg-date"
              labelText="Fecha"
              placeholder="dd/mm/aaaa"
            />
          </DatePicker>
        </div>

        <TextArea id="pg-area" labelText="Area de texto" rows={3} />
        <Search id="pg-search" labelText="Buscar" placeholder="Buscar" size="lg" />

        <div className="pg-row">
          <Checkbox id="pg-check-1" labelText="Checkbox" defaultChecked />
          <Checkbox id="pg-check-2" labelText="Sin marcar" />
          <Toggle id="pg-toggle" labelText="Toggle" defaultToggled />
        </div>

        <RadioButtonGroup name="pg-radio" defaultSelected="r1" legendText="Radio">
          <RadioButton labelText="Uno" value="r1" id="pg-r1" />
          <RadioButton labelText="Dos" value="r2" id="pg-r2" />
        </RadioButtonGroup>

        <Slider id="pg-slider" labelText="Slider" min={0} max={100} value={40} />

        <FileUploader
          labelTitle="Subir archivo"
          labelDescription="Maximo 500kb"
          buttonLabel="Seleccionar"
          filenameStatus="edit"
        />
      </Block>

      <Block title="Navegacion">
        <Breadcrumb noTrailingSlash>
          <BreadcrumbItem href="#">Inicio</BreadcrumbItem>
          <BreadcrumbItem href="#">Design system</BreadcrumbItem>
          <BreadcrumbItem isCurrentPage>Preview</BreadcrumbItem>
        </Breadcrumb>

        <ContentSwitcher onChange={() => undefined}>
          <Switch name="uno" text="Primero" />
          <Switch name="dos" text="Segundo" />
        </ContentSwitcher>

        <Tabs>
          <TabList aria-label="Ejemplo de tabs">
            <Tab>Resumen</Tab>
            <Tab>Detalle</Tab>
          </TabList>
          <TabPanels>
            <TabPanel>Contenido del primer tab.</TabPanel>
            <TabPanel>Contenido del segundo tab.</TabPanel>
          </TabPanels>
        </Tabs>

        <ProgressIndicator currentIndex={1}>
          <ProgressStep label="Brief" />
          <ProgressStep label="Diseno" />
          <ProgressStep label="Entrega" />
        </ProgressIndicator>

        <Pagination
          page={page}
          pageSize={10}
          pageSizes={[10, 20, 50]}
          totalItems={120}
          onChange={({ page: next }) => setPage(next)}
        />

        <p>
          <Link href="#">Un enlace de Carbon</Link>
        </p>
      </Block>

      <Block title="Contenedores y datos">
        <div className="pg-grid">
          <Tile>Tile normal</Tile>
          <ClickableTile href="#">Tile clicable</ClickableTile>
        </div>

        <div className="pg-row">
          <Tag type="red">red</Tag>
          <Tag type="magenta">magenta</Tag>
          <Tag type="purple">purple</Tag>
          <Tag type="blue">blue</Tag>
          <Tag type="cyan">cyan</Tag>
          <Tag type="teal">teal</Tag>
          <Tag type="green">green</Tag>
          <Tag type="gray">gray</Tag>
          <Tag type="outline">outline</Tag>
        </div>

        <TableContainer title="Tabla" description="Marcado estatico de Carbon">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Nombre</TableHeader>
                <TableHeader>Rol</TableHeader>
                <TableHeader>Estado</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {ROWS.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.nombre}</TableCell>
                  <TableCell>{row.rol}</TableCell>
                  <TableCell>{row.estado}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Accordion>
          <AccordionItem title="Primera seccion">
            Contenido plegable.
          </AccordionItem>
          <AccordionItem title="Segunda seccion">Mas contenido.</AccordionItem>
        </Accordion>

        <CodeSnippet type="single">pnpm dev</CodeSnippet>
      </Block>

      <Block title="Retroalimentacion">
        <div className="pg-stack pg-stack--tight">
          <InlineNotification
            kind="info"
            lowContrast
            hideCloseButton
            title="Info"
            subtitle="Notificacion informativa."
          />
          <InlineNotification
            kind="success"
            lowContrast
            hideCloseButton
            title="Exito"
            subtitle="Todo salio bien."
          />
          <InlineNotification
            kind="warning"
            lowContrast
            hideCloseButton
            title="Aviso"
            subtitle="Revisa esto antes de seguir."
          />
          <InlineNotification
            kind="error"
            lowContrast
            hideCloseButton
            title="Error"
            subtitle="Algo fallo."
          />
        </div>

        <ProgressBar label="Progreso" helperText="65%" value={65} max={100} />

        <div className="pg-row">
          <InlineLoading description="Cargando..." />
          <Loading withOverlay={false} small />
        </div>

        <SkeletonText paragraph lineCount={3} />

        <Button onClick={() => setModalOpen(true)}>Abrir modal</Button>
        <Modal
          open={modalOpen}
          modalHeading="Modal de ejemplo"
          primaryButtonText="Aceptar"
          secondaryButtonText="Cancelar"
          onRequestClose={() => setModalOpen(false)}
          onRequestSubmit={() => setModalOpen(false)}
        >
          <p>Cuerpo del modal sobre el tema activo.</p>
        </Modal>
      </Block>
    </div>
  );
}
