
import { useToast } from '../contexts/ToastContext';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Demand, Item, Priority, Group, CatalogItem, DemandStatus, Profile, UserRole } from '../types';
import { DEPARTMENTS, DEADLINE_RULES, addBusinessDays } from '../constants';
import { ArchiveIcon, SearchIcon, XIcon, TrashIcon, MailIcon, UserIcon, DollarIcon, FilterIcon, LightningBoltIcon, CalendarIcon, ShieldCheckIcon } from './icons';
import PageHeader from './PageHeader';

interface DemandFormProps {
  onSubmit: (demand: Omit<Demand, 'id' | 'protocol' | 'status' | 'proposals' | 'questions' | 'winner' | 'decisionDate' | 'homologatedBy' | 'createdAt' | 'group' | 'auditLogs'>, status: DemandStatus) => void;
  onCancel: () => void;
  groups: Group[];
  catalogItems: CatalogItem[];
  userProfile: Profile;
}

const DemandForm: React.FC<DemandFormProps> = ({ onSubmit, onCancel, groups, catalogItems, userProfile }) => {
  const { warning } = useToast();
  const [title, setTitle] = useState('');
  const [requestingDepartment, setRequestingDepartment] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [sector, setSector] = useState('');
  const [type, setType] = useState<'Materiais' | 'Serviços'>('Materiais');
  const [deliveryLocation, setDeliveryLocation] = useState('');
  const [priority, setPriority] = useState<Priority>(Priority.MEDIA);
  const [requestDescription, setRequestDescription] = useState('');
  const [justification, setJustification] = useState('');

  const [proposalDeadline, setProposalDeadline] = useState('');
  const [deliveryDeadline, setDeliveryDeadline] = useState('');

  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [items, setItems] = useState<Omit<Item, 'id'>[]>([]);

  const formRef = useRef<HTMLFormElement>(null);

  const isDepartmentRestricted = userProfile.role === UserRole.SECRETARIA;

  useEffect(() => {
    if (isDepartmentRestricted && userProfile.department) {
      setRequestingDepartment(userProfile.department);
    }
    if (userProfile.email) {
      setContactEmail(userProfile.email);
    }
  }, [userProfile, isDepartmentRestricted]);

  useEffect(() => {
    const now = new Date();
    const rules = DEADLINE_RULES[type][priority];
    if (rules) {
      const propDate = addBusinessDays(now, rules.proposalDays);
      const delDate = addBusinessDays(propDate, rules.deliveryDays);
      setProposalDeadline(propDate.toISOString().split('T')[0]);
      setDeliveryDeadline(delDate.toISOString().split('T')[0]);
    }
  }, [priority, type]);

  const handleAddItem = (item: CatalogItem, groupId: string) => {
    const newItem: Omit<Item, 'id'> = {
      description: item.name,
      unit: item.unit,
      quantity: 1,
      group_id: groupId,
      catalog_item_id: item.id
    };
    setItems(prev => [...prev, newItem]);
  };

  const handleRemoveItem = (itemIndex: number) => {
    setItems(prev => prev.filter((_, index) => index !== itemIndex));
  }

  const handleQuantityChange = (itemIndex: number, quantity: number) => {
    setItems(prev => prev.map((item, index) =>
      index === itemIndex ? { ...item, quantity: Math.max(1, quantity) } : item
    ));
  }

  const handleAddGroup = (groupId: string) => {
    if (groupId && !selectedGroupIds.includes(groupId)) {
      setSelectedGroupIds(prev => [...prev, groupId]);
    }
  }

  const handleRemoveGroup = (groupId: string) => {
    setSelectedGroupIds(prev => prev.filter(id => id !== groupId));
    setItems(prev => prev.filter(item => item.group_id !== groupId));
  }

  const availableGroups = useMemo(() => {
    return groups.filter(g => g.isActive && !selectedGroupIds.includes(g.id));
  }, [groups, selectedGroupIds]);

  const handleSubmit = (e: React.FormEvent, status: DemandStatus) => {
    e.preventDefault();
    if (!title.trim() || items.length === 0 || !contactEmail) {
      warning("Preencha todos os campos obrigatórios e adicione pelo menos um item.");
      return;
    }
    const finalItems = items.map((item, index) => ({ ...item, id: Date.now() + index }));
    const finalProposalDeadline = status !== DemandStatus.RASCUNHO ? new Date(proposalDeadline + 'T23:59:59').toISOString() : undefined;
    const finalDeliveryDeadline = status !== DemandStatus.RASCUNHO ? new Date(deliveryDeadline + 'T23:59:59').toISOString() : undefined;

    onSubmit({
      title, requestingDepartment, sector, contactEmail, type, deliveryLocation, priority,
      requestDescription, items: finalItems, justification: priority === Priority.URGENTE ? justification : undefined,
      proposalDeadline: finalProposalDeadline, deadline: finalDeliveryDeadline as any
    }, status);
  };

  const currentRules = DEADLINE_RULES[type][priority];

  return (
    <form ref={formRef} className="space-y-6 animate-fade-in-down">
      <PageHeader title="Registrar Nova Demanda" subtitle="O pedido passará por validação técnica do Almoxarifado antes da cotação." showButton={false} />

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-bold text-slate-700 mb-1">Título / Objeto da Demanda</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full rounded-xl border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-3" placeholder="Ex: Aquisição de cimento para manutenção de calçadas" required />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Secretaria Requisitante</label>
            <select value={requestingDepartment} onChange={e => setRequestingDepartment(e.target.value)} disabled={isDepartmentRestricted} className={`w-full rounded-xl border-slate-300 shadow-sm px-4 py-3 ${isDepartmentRestricted ? 'bg-slate-50 cursor-not-allowed' : ''}`} required>
              <option value="" disabled>Selecione...</option>
              {DEPARTMENTS.map(dep => <option key={dep} value={dep}>{dep}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Local de Entrega / Prestação</label>
            <input type="text" value={deliveryLocation} onChange={e => setDeliveryLocation(e.target.value)} className="w-full rounded-xl border-slate-300 shadow-sm px-4 py-3" placeholder="Ex: Almoxarifado Central ou Endereço Específico" required />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-bold text-slate-700 mb-1">Descrição Detalhada e Especificações Técnicas</label>
            <textarea value={requestDescription} onChange={e => setRequestDescription(e.target.value)} className="w-full rounded-xl border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-3 min-h-[120px]" placeholder="Descreva as especificações, marcas de referência, e detalhes importantes..." required />
          </div>

          {priority === Priority.URGENTE && (
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-red-700 mb-1">Justificativa de Urgência (Exigência Legal)</label>
              <textarea value={justification} onChange={e => setJustification(e.target.value)} className="w-full rounded-xl border-red-200 bg-red-50/30 px-4 py-3 shadow-sm focus:ring-red-500 focus:border-red-500" rows={3} placeholder="Descreva por que esta demanda precisa ser tratada em caráter de urgência..." required />
            </div>
          )}

          <div className="md:col-span-2 bg-slate-50 border border-slate-200 rounded-2xl p-6">
            <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2"><CalendarIcon className="w-5 h-5 text-blue-600" /> Prazos Automáticos (Baseados na Prioridade)</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Data Limite para Receber Propostas</label>
                <div className="relative">
                  <input type="date" value={proposalDeadline} readOnly className="w-full rounded-lg border-slate-300 bg-white shadow-sm px-4 py-2.5 cursor-not-allowed font-medium" />
                  <span className="text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 absolute right-2 top-2.5 font-bold">{currentRules?.proposalDays} dias úteis</span>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Prazo Final para Entrega / Conclusão</label>
                <div className="relative">
                  <input type="date" value={deliveryDeadline} readOnly className="w-full rounded-lg border-slate-300 bg-white shadow-sm px-4 py-2.5 cursor-not-allowed font-medium" />
                  <span className="text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 absolute right-2 top-2.5 font-bold">{currentRules?.deliveryDays} dias úteis</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-8">
          <h3 className="text-xl font-bold text-slate-800 mb-4">Itens e Grupos de Fornecimento</h3>
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 mb-6">
            <label className="block text-sm font-bold text-slate-700 mb-2">Adicionar Grupo de Atuação</label>
            <select onChange={e => handleAddGroup(e.target.value)} value="" className="w-full rounded-xl border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-3">
              <option value="" disabled>Selecione um grupo para liberar os itens...</option>
              {availableGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>

          <div className="space-y-6">
            {selectedGroupIds.map(groupId => {
              const group = groups.find(g => g.id === groupId);
              if (!group) return null;
              const groupItems = catalogItems.filter(ci => ci.groups.includes(groupId));
              const addedItemIds = items.filter(i => i.group_id === groupId).map(i => i.catalog_item_id);
              const availableItemsForGroup = groupItems.filter(ci => !addedItemIds.includes(ci.id));

              return (
                <div key={groupId} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  <div className="bg-slate-100 px-5 py-3 flex justify-between items-center border-b">
                    <h4 className="font-bold text-slate-800 flex items-center gap-2"><div className="w-1.5 h-5 bg-blue-600 rounded-full"></div> {group.name}</h4>
                    <button type="button" onClick={() => handleRemoveGroup(groupId)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-full transition-colors"><TrashIcon className="w-4 h-4" /></button>
                  </div>
                  <div className="p-5 space-y-4">
                    {items.filter(item => item.group_id === groupId).map((item, idx) => (
                      <div key={idx} className="flex flex-col sm:flex-row gap-4 items-center bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                        <div className="flex-grow text-sm font-bold text-slate-700">{item.description} <span className="text-xs font-normal text-slate-400">({item.unit})</span></div>
                        <div className="w-full sm:w-28 flex items-center gap-2">
                          <label className="text-xs text-slate-400 uppercase font-bold">Qtd:</label>
                          <input type="number" min="1" value={item.quantity} onChange={e => handleQuantityChange(items.indexOf(item), parseInt(e.target.value))} className="w-full rounded-lg border-slate-300 px-2 py-1 text-center font-bold" />
                        </div>
                        <button type="button" onClick={() => handleRemoveItem(items.indexOf(item))} className="text-slate-300 hover:text-red-500"><XIcon className="w-5 h-5" /></button>
                      </div>
                    ))}
                    <div className="pt-2">
                      <select value="" onChange={e => handleAddItem(availableItemsForGroup.find(i => i.id === e.target.value)!, groupId)} className="w-full rounded-lg border-dashed border-2 border-slate-300 text-slate-500 text-sm py-2 px-3 focus:border-blue-400">
                        <option value="" disabled>+ Selecionar item do catálogo...</option>
                        {availableItemsForGroup.map(item => <option key={item.id} value={item.id}>{item.name} ({item.unit})</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              );
            })}
            {selectedGroupIds.length === 0 && <div className="text-center py-12 text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">Adicione grupos de fornecimento para selecionar os itens.</div>}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-8 border-t border-slate-100">
          <button type="button" onClick={onCancel} className="px-6 py-3 border border-slate-300 rounded-xl text-slate-600 font-bold hover:bg-slate-50 transition-colors">Cancelar</button>
          <button type="button" onClick={(e) => handleSubmit(e, DemandStatus.RASCUNHO)} className="px-6 py-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-700 font-bold hover:bg-slate-200 transition-colors">Salvar Rascunho</button>
          <button type="button" onClick={(e) => handleSubmit(e, DemandStatus.AGUARDANDO_PROPOSTA)} className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 transform hover:scale-105 transition-all flex items-center gap-2"><LightningBoltIcon className="w-5 h-5" /> Publicar Cotação</button>
        </div>
      </div>
    </form>
  );
};

export default DemandForm;
