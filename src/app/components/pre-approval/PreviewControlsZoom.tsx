import svgPaths from "@/imports/svg-bmpjxzlu6h";
import { cn } from "@/lib/utils";

interface PreviewControlsZoomProps {
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onRotate?: () => void;
  onReset?: () => void;
  onDelete?: () => void;
  onEditSource?: () => void;
  onAutocorrect?: () => void;
  /** When true, hides the Edit Source Template and Autocorrect action buttons.
   *  Used for the video-only inline player view. */
  hideActionsBar?: boolean;
  className?: string;
}

function MinusSmallRemoveDelete() {
  return (
    <div className="absolute left-[-2px] size-[18px] top-0" data-name="minus-small, remove, delete">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 18">
        <g id="minus-small, remove, delete">
          <path d="M5.25 9H12.75" id="vector" stroke="var(--stroke-0, #473BAB)" strokeLinecap="round" strokeWidth="2" />
        </g>
      </svg>
    </div>
  );
}

function MaskedIcon() {
  return (
    <div className="h-[18px] relative shrink-0 w-[16px]" data-name="Masked Icon">
      <MinusSmallRemoveDelete />
    </div>
  );
}

function Base() {
  return (
    <div className="content-stretch flex gap-[8px] items-center justify-center relative shrink-0" data-name="Base">
      <MaskedIcon />
    </div>
  );
}

function Button({ onClick }: { onClick?: () => void }) {
  return (
    <div 
        className="content-stretch flex flex-col items-center justify-center overflow-clip px-[10px] py-[4px] relative rounded-[100px] shrink-0 cursor-pointer hover:bg-black/5 active:bg-black/10 transition-colors" 
        data-name="<Button>"
        onClick={onClick}
    >
      <Base />
    </div>
  );
}

function ArrowRotateCounterClockwiseRotateLeft() {
  return (
    <div className="absolute left-[-2px] size-[18px] top-0" data-name="arrow-rotate-counter-clockwise, rotate-left">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 18">
        <g id="arrow-rotate-counter-clockwise, rotate-left">
          <path d={svgPaths.pbd07ee0} id="vector" stroke="var(--stroke-0, #473BAB)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        </g>
      </svg>
    </div>
  );
}

function MaskedIcon1() {
  return (
    <div className="h-[18px] relative shrink-0 w-[16px]" data-name="Masked Icon">
      <ArrowRotateCounterClockwiseRotateLeft />
    </div>
  );
}

function Base1() {
  return (
    <div className="content-stretch flex gap-[8px] items-center justify-center relative shrink-0" data-name="Base">
      <MaskedIcon1 />
    </div>
  );
}

function Button1({ onClick }: { onClick?: () => void }) {
  return (
    <div 
        className="content-stretch flex flex-col items-center justify-center overflow-clip px-[10px] py-[4px] relative rounded-[100px] shrink-0 cursor-pointer hover:bg-black/5 active:bg-black/10 transition-colors" 
        data-name="<Button>"
        onClick={onClick}
    >
      <Base1 />
    </div>
  );
}

function PlusSmallAddSmall() {
  return (
    <div className="absolute left-[-2px] size-[18px] top-0" data-name="plus-small, add small">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 18">
        <g id="plus-small, add small">
          <path d={svgPaths.p1e0a0b00} id="vector" stroke="var(--stroke-0, #473BAB)" strokeLinecap="round" strokeWidth="2" />
        </g>
      </svg>
    </div>
  );
}

function MaskedIcon2() {
  return (
    <div className="h-[18px] relative shrink-0 w-[16px]" data-name="Masked Icon">
      <PlusSmallAddSmall />
    </div>
  );
}

function Base2() {
  return (
    <div className="content-stretch flex gap-[8px] items-center justify-center relative shrink-0" data-name="Base">
      <MaskedIcon2 />
    </div>
  );
}

function Button2({ onClick }: { onClick?: () => void }) {
  return (
    <div 
        className="content-stretch flex flex-col items-center justify-center overflow-clip px-[10px] py-[4px] relative rounded-[100px] shrink-0 cursor-pointer hover:bg-black/5 active:bg-black/10 transition-colors" 
        data-name="<Button>"
        onClick={onClick}
    >
      <Base2 />
    </div>
  );
}

function ButtonGroup({ onZoomIn, onZoomOut, onRotate }: { onZoomIn?: () => void, onZoomOut?: () => void, onRotate?: () => void }) {
  return (
    <div className="relative rounded-[100px] shrink-0" data-name="<ButtonGroup>">
      <div className="content-stretch flex items-center overflow-clip relative rounded-[inherit]">
        <Button onClick={onZoomOut} />
        {/* Simple 1px divider */}
        <div className="w-px h-[14px] bg-[#6356E1]/20 mx-1" />
        <Button1 onClick={onRotate} />
        {/* Simple 1px divider */}
        <div className="w-px h-[14px] bg-[#6356E1]/20 mx-1" />
        <Button2 onClick={onZoomIn} />
      </div>
      <div aria-hidden="true" className="absolute border border-[rgba(99,86,225,0.5)] border-solid inset-0 pointer-events-none rounded-[100px]" />
    </div>
  );
}

function ArrowRotateLeftRightRepeatRefresh() {
  return (
    <div className="relative shrink-0 size-[20px]" data-name="arrow-rotate-left-right, repeat, refresh">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
        <g id="arrow-rotate-left-right, repeat, refresh">
          <path d={svgPaths.p3f8a5300} id="vector" stroke="var(--stroke-0, #111014)" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.56" strokeWidth="1.5" />
        </g>
      </svg>
    </div>
  );
}

function Icon() {
  return (
    <div className="content-stretch flex items-start relative shrink-0" data-name="<Icon>">
      <ArrowRotateLeftRightRepeatRefresh />
    </div>
  );
}

function IconButton({ onClick }: { onClick?: () => void }) {
  return (
    <div 
        className="bg-white content-stretch flex flex-col items-center justify-center overflow-clip p-[5px] relative rounded-[100px] shadow-[0px_1px_5px_0px_rgba(0,0,0,0.12),0px_2px_2px_0px_rgba(0,0,0,0.14),0px_3px_1px_-2px_rgba(0,0,0,0.2)] shrink-0 cursor-pointer hover:bg-gray-50 active:bg-gray-100 transition-colors" 
        data-name="<IconButton>"
        onClick={onClick}
    >
      <Icon />
    </div>
  );
}

function TrashCanDeleteRemoveGarbageWaste() {
  return (
    <div className="relative shrink-0 size-[20px]" data-name="trash-can, delete, remove, garbage, waste">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
        <g id="trash-can, delete, remove, garbage, waste">
          <path d={svgPaths.p1702c200} fill="var(--stroke-0, #111014)" fillOpacity="0.56" id="vector" />
        </g>
      </svg>
    </div>
  );
}

function Icon1() {
  return (
    <div className="content-stretch flex items-start relative shrink-0" data-name="<Icon>">
      <TrashCanDeleteRemoveGarbageWaste />
    </div>
  );
}

function IconButton1({ onClick }: { onClick?: () => void }) {
  return (
    <div 
        className="bg-white content-stretch flex flex-col items-center justify-center overflow-clip p-[5px] relative rounded-[100px] shadow-[0px_1px_5px_0px_rgba(0,0,0,0.12),0px_2px_2px_0px_rgba(0,0,0,0.14),0px_3px_1px_-2px_rgba(0,0,0,0.2)] shrink-0 cursor-pointer hover:bg-gray-50 active:bg-gray-100 transition-colors" 
        data-name="<IconButton>"
        onClick={onClick}
    >
      <Icon1 />
    </div>
  );
}

function PencilEditWrite() {
  return (
    <div className="absolute left-[-2px] size-[18px] top-0" data-name="pencil, edit, write">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 18">
        <g id="pencil, edit, write">
          <path d={svgPaths.p16b915c0} id="vector" stroke="var(--stroke-0, #473BAB)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        </g>
      </svg>
    </div>
  );
}

function MaskedIcon3() {
  return (
    <div className="h-[18px] relative shrink-0 w-[16px]" data-name="Masked Icon">
      <PencilEditWrite />
    </div>
  );
}

function Base3() {
  return (
    <div className="content-stretch flex gap-[8px] items-center justify-center relative shrink-0" data-name="Base">
      <MaskedIcon3 />
      <p className="capitalize css-ew64yg font-['Roboto:Medium',sans-serif] font-medium leading-[22px] relative shrink-0 text-[#473bab] text-[13px] tracking-[0.46px]" style={{ fontVariationSettings: "'wdth' 100" }}>
        Edit source template
      </p>
    </div>
  );
}

function RestoreButton({ onClick }: { onClick?: () => void }) {
  return (
    <div 
        className="relative rounded-[100px] shrink-0 cursor-pointer group" 
        data-name="Restore Button"
        onClick={onClick}
    >
      <div className="content-stretch flex flex-col items-center justify-center overflow-clip px-[10px] py-[4px] relative rounded-[inherit] transition-colors group-hover:bg-[#473bab]/10">
        <Base3 />
      </div>
      <div aria-hidden="true" className="absolute border border-[rgba(99,86,225,0.5)] border-solid inset-0 pointer-events-none rounded-[100px]" />
    </div>
  );
}

function IconLeft() {
  return (
    <div className="absolute left-[calc(50%-1px)] size-[18px] top-1/2 translate-x-[-50%] translate-y-[-50%]" data-name="Icon Left">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 18">
        <g id="Icon Left">
          <path d={svgPaths.p19772280} fill="var(--fill-0, black)" id="vector" stroke="var(--stroke-0, white)" />
        </g>
      </svg>
    </div>
  );
}

function MaskedIcon4() {
  return (
    <div className="h-[18px] relative shrink-0 w-[16px]" data-name="Masked Icon">
      <IconLeft />
    </div>
  );
}

function Base4() {
  return (
    <div className="content-stretch flex gap-[8px] items-center justify-center relative shrink-0" data-name="Base">
      <MaskedIcon4 />
      <p className="capitalize css-ew64yg font-['Roboto:Medium',sans-serif] font-medium leading-[22px] relative shrink-0 text-[13px] text-white tracking-[0.46px]" style={{ fontVariationSettings: "'wdth' 100" }}>
        Autocorrect
      </p>
    </div>
  );
}

function ConfigureButton({ onClick }: { onClick?: () => void }) {
  return (
    <div 
        className="bg-[#473bab] content-stretch flex flex-col items-center justify-center overflow-clip px-[10px] py-[4px] relative rounded-[100px] shrink-0 cursor-pointer transition-colors hover:bg-[#3d3293] active:bg-[#322a7a]" 
        data-name="Configure Button"
        onClick={onClick}
    >
      <Base4 />
    </div>
  );
}

export function PreviewControlsZoom({
  onZoomIn,
  onZoomOut,
  onRotate,
  onReset,
  onDelete,
  onEditSource,
  onAutocorrect,
  hideActionsBar = false,
  className
}: PreviewControlsZoomProps) {
  return (
    <div className={cn("content-stretch flex items-center justify-between px-3 py-1 relative w-full pointer-events-auto bg-white/95 backdrop-blur-sm rounded-full shadow-sm border border-white/60", className)} data-name="Zoom">
      <div className="content-stretch flex items-start relative shrink-0" data-name=".ZoomController">
        <ButtonGroup onZoomIn={onZoomIn} onZoomOut={onZoomOut} onRotate={onRotate} />
      </div>
      <div className="content-stretch flex gap-[8px] h-[30px] items-center justify-end relative shrink-0">
        <IconButton onClick={onReset} />
        <IconButton1 onClick={onDelete} />
        {!hideActionsBar && (
          <>
            <div className="content-stretch flex flex-col items-end justify-center relative shrink-0" data-name="Edit Source Button">
              <RestoreButton onClick={onEditSource} />
            </div>
            <div className="content-stretch flex flex-col items-end justify-center relative shrink-0" data-name="Canvas Main Button">
              <ConfigureButton onClick={onAutocorrect} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
